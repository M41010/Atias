"""Análisis de una sesión de captura completa a partir de un manifiesto JSON."""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from .domain import CropProfile, Origin, Severity, Warning
from .store import CountRow, save_session
from .vision.detector import Detector
from .vision.pipeline import VideoError, VideoResult, VideoSpec, analyze_video

METHODS = {"movil_piloto", "sintetico", "rail", "camara_fija"}


class ManifestError(ValueError):
    pass


@dataclass(frozen=True)
class Manifest:
    greenhouse: str
    captured_at: datetime
    method: str
    origin: Origin
    out_of_sample: bool
    videos: tuple[VideoSpec, ...]

    @property
    def week(self) -> str:
        year, week, _ = self.captured_at.isocalendar()
        return f"{year}-W{week:02d}"


def load_manifest(path: str | Path) -> Manifest:
    """Lee y comprueba el manifiesto. Las rutas de vídeo son relativas a él."""
    file = Path(path)
    try:
        data = json.loads(file.read_text(encoding="utf-8"))
        method = data["metodo"]
        if method not in METHODS:
            raise ManifestError(f"Método desconocido: {method}. Opciones: {sorted(METHODS)}")
        videos = []
        for v in data["videos"]:
            if v["lado"] not in {"A", "B"}:
                raise ManifestError(f"Lado inválido: {v['lado']}. Usa A o B.")
            videos.append(VideoSpec(
                path=file.parent / v["archivo"],
                greenhouse=data["invernadero"],
                crop=v["cultivo"],
                row=str(v["hilera"]),
                side=v["lado"],
                expected_plants=tuple(str(p) for p in v["plantas"]),
                marker_size_mm=float(v["tamano_marcador_mm"]),
            ))
        if not videos:
            raise ManifestError("El manifiesto no contiene vídeos.")
        return Manifest(
            greenhouse=data["invernadero"],
            captured_at=datetime.fromisoformat(data["fecha_captura"]),
            method=method,
            origin=Origin(data.get("origen", Origin.MEASURED)),
            out_of_sample=bool(data.get("fuera_de_muestra", True)),
            videos=tuple(videos),
        )
    except KeyError as missing:
        raise ManifestError(f"Falta el campo {missing} en el manifiesto") from missing


def _coverage_warnings(manifest: Manifest, results: list[VideoResult]) -> list[Warning]:
    sides: dict[tuple[str, str], set[str]] = {}
    for spec in manifest.videos:
        sides.setdefault((spec.crop, spec.row), set())
    for result in results:
        sides[(result.spec.crop, result.spec.row)].add(result.spec.side)
    warnings = []
    for (_crop, row), seen in sorted(sides.items()):
        if len(seen) < 2:
            missing = sorted({"A", "B"} - seen)
            warnings.append(Warning(
                "LADO_SIN_CAPTURA", Severity.HIGH,
                f"Sin datos del lado {' ni '.join(missing)}. La calibración supone ambos lados: "
                "los kg de esta hilera quedan por debajo de lo real.",
                f"{manifest.greenhouse} · hilera {row}",
            ))
    return warnings


def analyze_session(
    manifest: Manifest, profiles: dict[str, CropProfile], detector: Detector,
    conn: sqlite3.Connection,
) -> int:
    missing = sorted({v.crop for v in manifest.videos} - profiles.keys())
    if missing:
        raise ManifestError(f"No hay perfil para los cultivos: {', '.join(missing)}")

    results: list[VideoResult] = []
    warnings: list[Warning] = []
    for spec in manifest.videos:
        try:
            results.append(analyze_video(spec, profiles[spec.crop], detector))
        except VideoError as error:
            warnings.append(Warning(
                "VIDEO_ILEGIBLE", Severity.HIGH, str(error),
                f"{spec.greenhouse} · hilera {spec.row} · lado {spec.side}",
            ))

    for result in results:
        warnings.extend(result.warnings)
    warnings.extend(_coverage_warnings(manifest, results))

    if not detector.trained:
        warnings.append(Warning(
            "DETECTOR_NO_ENTRENADO", Severity.HIGH,
            f"Detector «{detector.name}»: es solo de referencia y no sirve para imagen real.",
            manifest.greenhouse,
        ))

    used = {p.crop: p for c, p in profiles.items() if c in {v.crop for v in manifest.videos}}
    # Un parámetro simulado contamina el resultado aunque el vídeo sea real.
    origin = Origin.SIMULATED if (
        manifest.origin == Origin.SIMULATED
        or any(p.uses_simulated_parameters() for p in used.values())
    ) else Origin.MEASURED

    for profile in used.values():
        if profile.side_overlap is None:
            warnings.append(Warning(
                "SOLAPE_SIN_MEDIR", Severity.MEDIUM,
                f"{profile.label}: solape entre lados sin medir. Se cuenta max(A, B), una "
                "suposición prudente para evitar el doble conteo.",
                manifest.greenhouse,
            ))

    if not results:
        status = "fallido"
    elif any(w.severity == Severity.HIGH for w in warnings):
        status = "con_advertencias"
    else:
        status = "completado"

    counts = [
        CountRow(r.spec.crop, r.spec.row, plant, r.spec.side, fruit_class, n)
        for r in results
        for plant, per_class in r.counts.items()
        for fruit_class, n in per_class.items()
    ]
    quality = [{"hilera": r.spec.row, "lado": r.spec.side, "cultivo": r.spec.crop,
                "fotogramas": r.frames, **r.quality} for r in results]
    return save_session(
        conn,
        greenhouse=manifest.greenhouse,
        week=manifest.week,
        captured_at=manifest.captured_at.isoformat(),
        method=manifest.method,
        origin=origin,
        detector=detector.name,
        status=status,
        out_of_sample=manifest.out_of_sample,
        profiles=used,
        quality=quality,
        counts=counts,
        warnings=warnings,
    )
