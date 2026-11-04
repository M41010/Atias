"""De un vídeo de una pasada a recuentos por planta y clase, con advertencias de calidad.

Convención del piloto: cada pasada recorre un solo lado de una hilera. Cada planta lleva en
el tutor un marcador ArUco cuyo id es su número dentro de la hilera. El tamaño conocido del
marcador da además la escala (mm/px) para medir el calibre.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

from ..domain import UNASSIGNED_PLANT, CropProfile, Severity, Warning
from .detector import Detector
from .maturity import (
    UNCLASSIFIED,
    classify_caliber,
    classify_color,
    track_caliber_mm,
    vote_color,
)
from .tracker import CenterTracker

ARUCO_DICTIONARY = cv2.aruco.DICT_4X4_250

# Umbrales provisionales para disparar advertencias: hay que ajustarlos con vídeo real.
MIN_MEAN_BRIGHTNESS = 35.0
MAX_OVEREXPOSED_SHARE = 0.25
MIN_SHARPNESS = 25.0
MIN_MARKER_FRAME_SHARE = 0.5
MAX_UNASSIGNED_SHARE = 0.2


class VideoError(RuntimeError):
    pass


@dataclass(frozen=True)
class VideoSpec:
    path: Path
    greenhouse: str
    crop: str
    row: str
    side: str  # "A" | "B"
    expected_plants: tuple[str, ...]
    marker_size_mm: float


@dataclass
class VideoResult:
    spec: VideoSpec
    counts: dict[str, dict[str, int]]  # planta -> clase -> frutos
    frames: int
    quality: dict[str, float]
    warnings: list[Warning] = field(default_factory=list)


@dataclass(frozen=True)
class MarkerSighting:
    plant: str
    center_x: float
    side_px: float


class MarkerLocator:
    def __init__(self) -> None:
        dictionary = cv2.aruco.getPredefinedDictionary(ARUCO_DICTIONARY)
        self._detector = cv2.aruco.ArucoDetector(dictionary, cv2.aruco.DetectorParameters())

    def locate(self, frame: np.ndarray) -> list[MarkerSighting]:
        corners, ids, _ = self._detector.detectMarkers(frame)
        if ids is None:
            return []
        sightings = []
        for marker_corners, marker_id in zip(corners, ids.flatten(), strict=True):
            points = marker_corners.reshape(4, 2)
            side = float(np.mean(np.linalg.norm(points - np.roll(points, 1, axis=0), axis=1)))
            sightings.append(MarkerSighting(str(int(marker_id)), float(points[:, 0].mean()), side))
        return sightings


def _nearest_plant(x: float, sightings: list[MarkerSighting]) -> str | None:
    """Planta del marcador más cercano, si el fruto cae dentro de su media separación."""
    if not sightings:
        return None
    ordered = sorted(sightings, key=lambda s: abs(s.center_x - x))
    nearest = ordered[0]
    if len(sightings) >= 2:
        positions = sorted(s.center_x for s in sightings)
        half_spacing = float(np.median(np.diff(positions))) / 2
        if abs(nearest.center_x - x) > half_spacing * 1.1:
            return None
    return nearest.plant


def analyze_video(spec: VideoSpec, profile: CropProfile, detector: Detector,
                  sample_quality_every: int = 5) -> VideoResult:
    capture = cv2.VideoCapture(str(spec.path))
    if not capture.isOpened():
        raise VideoError(f"No se pudo abrir el vídeo: {spec.path}")

    locator = MarkerLocator()
    tracker = CenterTracker()
    brightness, overexposed, sharpness = [], [], []
    frames = frames_with_marker = 0
    plants_seen: set[str] = set()
    use_color = profile.criterion == "color"

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frames % sample_quality_every == 0:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                brightness.append(float(gray.mean()))
                overexposed.append(float((gray >= 245).mean()))
                sharpness.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))

            sightings = locator.locate(frame)
            if sightings:
                frames_with_marker += 1
                plants_seen.update(s.plant for s in sightings)
            mm_per_px = (
                float(np.median([spec.marker_size_mm / s.side_px for s in sightings]))
                if sightings else None
            )

            detections = detector.detect(frame)
            attributes = []
            for detection in detections:
                attrs: dict = {"plant": _nearest_plant(detection.center[0], sightings)}
                if use_color:
                    attrs["color"] = classify_color(frame, detection, profile)
                elif mm_per_px is not None and not detection.truncated:
                    attrs["length_mm"] = detection.length_px * mm_per_px
                    attrs["diameter_mm"] = detection.diameter_px * mm_per_px
                attributes.append(attrs)
            tracker.update(frames, detections, attributes)
            frames += 1
    finally:
        capture.release()

    if frames == 0:
        raise VideoError(f"El vídeo no contiene fotogramas legibles: {spec.path}")

    counts: dict[str, Counter] = defaultdict(Counter)
    tracks = tracker.finish()
    for track in tracks:
        votes = Counter(o.attributes["plant"] for o in track.observations
                        if o.attributes.get("plant"))
        plant = votes.most_common(1)[0][0] if votes else UNASSIGNED_PLANT
        if use_color:
            fruit_class = vote_color([o.attributes["color"] for o in track.observations])
        else:
            length, diameter = track_caliber_mm(
                [o.attributes["length_mm"] for o in track.observations
                 if "length_mm" in o.attributes],
                [o.attributes["diameter_mm"] for o in track.observations
                 if "diameter_mm" in o.attributes],
            )
            fruit_class = classify_caliber(length, diameter, profile.classes)
        counts[plant][fruit_class] += 1

    quality = {
        "brillo_medio": float(np.mean(brightness)),
        "sobreexpuesto": float(np.mean(overexposed)),
        "nitidez": float(np.median(sharpness)),
        "fotogramas_con_marcador": frames_with_marker / frames,
    }
    result = VideoResult(spec, {p: dict(c) for p, c in counts.items()}, frames, quality)
    result.warnings = _quality_warnings(result, plants_seen, len(tracks), detector)
    return result


def _quality_warnings(result: VideoResult, plants_seen: set[str], n_tracks: int,
                      detector: Detector) -> list[Warning]:
    spec, quality = result.spec, result.quality
    scope = f"{spec.greenhouse} · hilera {spec.row} · lado {spec.side}"
    warnings: list[Warning] = []

    def add(code: str, severity: Severity, message: str) -> None:
        warnings.append(Warning(code, severity, message, scope))

    if quality["brillo_medio"] < MIN_MEAN_BRIGHTNESS:
        add("POCA_LUZ", Severity.HIGH,
            "Imagen demasiado oscura: el recuento y el color pueden no ser fiables.")
    if quality["sobreexpuesto"] > MAX_OVEREXPOSED_SHARE:
        add("SOBREEXPUESTO", Severity.HIGH,
            "Demasiadas zonas quemadas por exceso de luz.")
    if quality["nitidez"] < MIN_SHARPNESS:
        add("DESENFOCADO", Severity.HIGH,
            "Imagen movida o desenfocada: revisa velocidad y limpieza de la lente.")
    if quality["fotogramas_con_marcador"] < MIN_MARKER_FRAME_SHARE:
        add("POCOS_MARCADORES", Severity.MEDIUM,
            "Se ven marcadores en pocos fotogramas: la asignación a plantas es menos segura.")

    missing = [p for p in spec.expected_plants if p not in plants_seen]
    if missing:
        add("PLANTAS_NO_VISTAS", Severity.HIGH,
            f"No se vio el marcador de {len(missing)} planta(s): {', '.join(missing)}.")

    unassigned = sum(result.counts.get(UNASSIGNED_PLANT, {}).values())
    if n_tracks and unassigned / n_tracks > MAX_UNASSIGNED_SHARE:
        add("FRUTOS_SIN_PLANTA", Severity.MEDIUM,
            f"{unassigned} de {n_tracks} frutos no se pudieron asignar a una planta. Cuentan "
            "para la hilera, no para una planta concreta.")

    unclassified = sum(c.get(UNCLASSIFIED, 0) for c in result.counts.values())
    if n_tracks and unclassified / n_tracks > 0.1:
        add("FRUTOS_SIN_CLASE", Severity.MEDIUM,
            f"{unclassified} de {n_tracks} frutos sin clasificar por "
            f"{'color' if spec.crop != 'pepino' else 'calibre'}: no suman a los kg.")
    return warnings
