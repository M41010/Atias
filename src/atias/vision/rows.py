"""De un vídeo de un lado de hilera a frutos por tramo y clase, sin marcadores físicos.

La hilera se divide en tramos iguales. La posición de cada fruto dentro de la hilera sale de
cuánto se ha desplazado la imagen hasta que se ve: la cámara recorre la hilera de lado, así que
el desplazamiento acumulado es proporcional a lo recorrido aunque el paso no sea constante o haya
paradas. Si apenas hay desplazamiento medible, se usa el tiempo y se avisa.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

from ..domain import CropProfile
from .detector import Detector
from .maturity import UNCLASSIFIED, classify_color, vote_color
from .tracker import CenterTracker

# Fotogramas analizados por segundo: un fruto tarda unos segundos en cruzar la imagen a paso
# lento, así que con 3 se ve en varios fotogramas y el seguimiento no lo cuenta dos veces.
DEFAULT_ANALYSIS_FPS = 3.0
FLOW_WIDTH = 320
# Por debajo de este recorrido (en anchos de imagen) el desplazamiento no es fiable.
MIN_PAN_FRAMES = 2.0
MIN_SHARPNESS = 25.0
MIN_MEAN_BRIGHTNESS = 35.0


class RowVideoError(RuntimeError):
    pass


@dataclass
class RowResult:
    tramos: list[dict[str, int]]  # Por tramo, frutos por clase.
    analyzed_frames: int
    duration_s: float
    position: str  # "desplazamiento" | "tiempo"
    detector: str
    warnings: list[str] = field(default_factory=list)
    # Posición de cada fruto a lo largo del recorrido (0 = cabecera, 1 = final) y su clase.
    # Sirve para comparar con el conteo a mano entre dos cintas medidas en metros.
    fruit_positions: list[tuple[float, str]] = field(default_factory=list)

    def mature(self, profile: CropProfile) -> list[int]:
        return [
            sum(n for c, n in tramo.items() if c in profile.mature_ids) for tramo in self.tramos
        ]

    def to_dict(self, profile: CropProfile) -> dict:
        mature = self.mature(profile)
        return {
            "detector": self.detector,
            "tramos": [
                {"n": i + 1, "clases": tramo, "maduros": m}
                for i, (tramo, m) in enumerate(zip(self.tramos, mature, strict=True))
            ],
            "maduros": sum(mature),
            "frutos": sum(sum(t.values()) for t in self.tramos),
            "fotogramasAnalizados": self.analyzed_frames,
            "duracionS": round(self.duration_s, 1),
            "posicion": self.position,
            "avisos": self.warnings,
            "posicionesMaduros": sorted(
                round(p, 4) for p, label in self.fruit_positions if label in profile.mature_ids
            ),
        }


def _pan(previous: np.ndarray, current: np.ndarray) -> tuple[float, float]:
    """Desplazamiento de la imagen entre dos fotogramas, en fracción del ancho y del alto."""
    (dx, dy), response = cv2.phaseCorrelate(previous, current)
    if response < 0.05:
        return 0.0, 0.0
    return dx / previous.shape[1], dy / previous.shape[0]


def _flow_gray(frame: np.ndarray) -> np.ndarray:
    height, width = frame.shape[:2]
    small = cv2.resize(
        frame,
        (FLOW_WIDTH, max(1, round(height * FLOW_WIDTH / width))),
        interpolation=cv2.INTER_AREA,
    )
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32)
    return gray * cv2.createHanningWindow(gray.shape[::-1], cv2.CV_32F)


def fraction_of(position: float, total: float) -> float:
    """Posición relativa (0 a 1) a lo largo del recorrido."""
    if total <= 0:
        return 0.0
    return min(1.0, max(0.0, position / total))


def tramo_of(position: float, total: float, tramos: int) -> int:
    """Tramo (desde 0) de una posición a lo largo del recorrido."""
    if total <= 0:
        return 0
    return min(tramos - 1, max(0, int(position / total * tramos)))


def analyze_row_video(
    path: str | Path,
    profile: CropProfile,
    detector: Detector,
    tramos: int,
    analysis_fps: float = DEFAULT_ANALYSIS_FPS,
) -> RowResult:
    if tramos < 1:
        raise ValueError("Hace falta al menos un tramo")
    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        raise RowVideoError(f"No se pudo abrir el vídeo: {path}")
    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, round(fps / analysis_fps))

    tracker = CenterTracker(min_hits=3, max_age=4)
    positions: list[float] = []  # Desplazamiento acumulado en cada fotograma analizado.
    brightness, sharpness = [], []
    previous = None
    cumulative = 0.0
    index = analyzed = 0
    try:
        while True:
            ok = capture.grab()
            if not ok:
                break
            if index % step:
                index += 1
                continue
            ok, frame = capture.retrieve()
            if not ok:
                break
            gray = _flow_gray(frame)
            pan = (0.0, 0.0)
            if previous is not None:
                pan = _pan(previous, gray)
                cumulative += pan[0]
            previous = gray
            positions.append(cumulative)

            plain = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            brightness.append(float(plain.mean()))
            sharpness.append(float(cv2.Laplacian(cv2.resize(plain, (640, 360)), cv2.CV_64F).var()))

            detections = detector.detect(frame)
            attributes = []
            for detection in detections:
                if detection.label is not None:
                    attributes.append({"clase": detection.label})
                elif profile.criterion == "color":
                    attributes.append({"clase": classify_color(frame, detection, profile)})
                else:
                    # Sin escala no se mide el calibre: el detector debe dar la clase.
                    attributes.append({"clase": UNCLASSIFIED})
            height, width = frame.shape[:2]
            hint = (pan[0] * width, pan[1] * height) if analyzed > 0 else None
            tracker.update(analyzed, detections, attributes, motion=hint)
            analyzed += 1
            index += 1
    finally:
        capture.release()

    if analyzed == 0:
        raise RowVideoError(f"El vídeo no contiene fotogramas legibles: {path}")

    warnings: list[str] = []
    travel = abs(positions[-1])
    by_time = travel < MIN_PAN_FRAMES
    if by_time:
        warnings.append("POSICION_POR_TIEMPO")
    sign = 1.0 if positions[-1] >= 0 else -1.0
    # Se usa el máximo alcanzado: si la cámara retrocede un poco, los frutos no cambian de tramo.
    reached = np.maximum.accumulate(np.array(positions) * sign)

    counts = [Counter() for _ in range(tramos)]
    fruit_positions: list[tuple[float, str]] = []
    for track in tracker.finish():
        middle = track.observations[len(track.observations) // 2].frame
        if by_time:
            fraction = fraction_of(middle, analyzed - 1)
        else:
            fraction = fraction_of(float(reached[middle]), float(reached[-1]))
        tramo = min(tramos - 1, int(fraction * tramos))
        label = vote_color([o.attributes["clase"] for o in track.observations])
        counts[tramo][label] += 1
        fruit_positions.append((fraction, label))

    if np.mean(brightness) < MIN_MEAN_BRIGHTNESS:
        warnings.append("POCA_LUZ")
    if np.median(sharpness) < MIN_SHARPNESS:
        warnings.append("DESENFOCADO")
    total = sum(sum(c.values()) for c in counts)
    if total and sum(c.get(UNCLASSIFIED, 0) for c in counts) / total > 0.1:
        warnings.append("FRUTOS_SIN_CLASE")
    if not getattr(detector, "trained", False):
        warnings.append("DETECTOR_DE_PRUEBA")

    return RowResult(
        tramos=[dict(c) for c in counts],
        analyzed_frames=analyzed,
        duration_s=index / fps,
        position="tiempo" if by_time else "desplazamiento",
        detector=getattr(detector, "name", "desconocido"),
        warnings=warnings,
        fruit_positions=fruit_positions,
    )
