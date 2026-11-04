"""Modelo de dominio: perfiles de cultivo, parámetros de peso y advertencias.

Todo parámetro numérico lleva su ``origin``. Así un valor simulado nunca puede
pasar por un dato medido sin que la aplicación lo advierta.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from enum import StrEnum
from pathlib import Path

UNASSIGNED_PLANT = "SIN_ASIGNAR"


class Origin(StrEnum):
    SIMULATED = "simulado"
    MEASURED = "medido"


class Semantics(StrEnum):
    """Qué representa una estimación. Nunca deben mezclarse."""

    OBSERVED = "observado_en_captura"
    FORECAST_MON_THU = "prevision_lunes_jueves"  # Fase 3: todavía no existe en el sistema.


class HarvestScope(StrEnum):
    """Qué cosecha se pesó. Determina con qué estimación es comparable."""

    IMMEDIATE = "cosecha_inmediata"  # Se recoge todo lo maduro justo tras la captura.
    MON_THU = "lunes_jueves"  # Recolección habitual: incluye fruta que maduró después.


class Severity(StrEnum):
    HIGH = "alta"
    MEDIUM = "media"
    INFO = "info"


@dataclass(frozen=True)
class Warning:
    code: str
    severity: Severity
    message: str
    scope: str = ""


@dataclass(frozen=True)
class WeightParam:
    """Peso por fruto de una clase, obtenido de pesadas o registros."""

    mean_g: float
    sd_g: float
    n_samples: int
    origin: Origin

    @property
    def standard_error_g(self) -> float:
        return self.sd_g / self.n_samples**0.5 if self.n_samples > 0 else 0.0


@dataclass(frozen=True)
class Calibration:
    """Frutos reales por cada fruto contado, medido en plantas de control.

    Absorbe oclusión, doble conteo residual y errores del detector. Es específico
    de un detector y de un método de captura: al cambiar cualquiera de ellos hay
    que volver a medirlo.
    """

    factor: float
    factor_sd: float
    n_plants: int
    origin: Origin


@dataclass(frozen=True)
class FruitClass:
    id: str
    label: str
    mature: bool
    hue_ranges: tuple[tuple[int, int], ...] = ()  # OpenCV HSV: H en 0-179.
    length_mm: tuple[float, float] | None = None
    diameter_mm: tuple[float, float] | None = None


@dataclass(frozen=True)
class CropProfile:
    crop: str
    label: str
    criterion: str  # "color" | "calibre"
    classes: tuple[FruitClass, ...]
    weights: dict[str, WeightParam] = field(default_factory=dict)
    calibration: Calibration | None = None
    # Fracción del menor recuento de los dos lados que se considera visto por ambos.
    # 1.0 => max(A, B), suposición prudente (cota inferior); 0.0 => A + B (cota superior).
    side_overlap: float | None = None
    overlap_origin: Origin | None = None

    def fruit_class(self, class_id: str) -> FruitClass | None:
        return next((c for c in self.classes if c.id == class_id), None)

    @property
    def mature_ids(self) -> set[str]:
        return {c.id for c in self.classes if c.mature}

    def uses_simulated_parameters(self) -> bool:
        origins = [w.origin for w in self.weights.values()]
        if self.calibration:
            origins.append(self.calibration.origin)
        if self.overlap_origin:
            origins.append(self.overlap_origin)
        return Origin.SIMULATED in origins

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: dict) -> CropProfile:
        classes = []
        for c in d["classes"]:
            classes.append(
                FruitClass(
                    id=c["id"],
                    label=c["label"],
                    mature=c["mature"],
                    hue_ranges=tuple(tuple(r) for r in c.get("hue_ranges") or ()),
                    length_mm=tuple(c["length_mm"]) if c.get("length_mm") else None,
                    diameter_mm=tuple(c["diameter_mm"]) if c.get("diameter_mm") else None,
                )
            )
        weights = {
            k: WeightParam(v["mean_g"], v["sd_g"], v["n_samples"], Origin(v["origin"]))
            for k, v in (d.get("weights") or {}).items()
            if v is not None
        }
        cal = d.get("calibration")
        return CropProfile(
            crop=d["crop"],
            label=d["label"],
            criterion=d["criterion"],
            classes=tuple(classes),
            weights=weights,
            calibration=Calibration(
                cal["factor"], cal["factor_sd"], cal["n_plants"], Origin(cal["origin"])
            )
            if cal
            else None,
            side_overlap=d.get("side_overlap"),
            overlap_origin=Origin(d["overlap_origin"]) if d.get("overlap_origin") else None,
        )


def load_profiles(path: str | Path) -> dict[str, CropProfile]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return {p["crop"]: CropProfile.from_dict(p) for p in data["cultivos"]}


def save_profiles(profiles: dict[str, CropProfile], path: str | Path) -> None:
    Path(path).write_text(
        json.dumps({"cultivos": [p.to_dict() for p in profiles.values()]}, indent=2,
                   ensure_ascii=False),
        encoding="utf-8",
    )
