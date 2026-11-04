"""Conversión de recuentos a kilogramos. Determinista y sin modelos de lenguaje.

Modelo para un ámbito (planta, hilera o invernadero) y un cultivo::

    n_ajustado[c] = n_contado[c] * k
    kg            = suma_c(n_ajustado[c] * peso_medio[c]) / 1000

El rango orientativo se calcula siempre desde los recuentos del ámbito y no sumando
rangos de nivel inferior. Los errores de ``k`` y del peso medio son sistemáticos: afectan
a todas las plantas a la vez y no se compensan al agregar. Solo se reduce la variación
fruto a fruto.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, field

from .domain import CropProfile, Severity, Warning

Z_90 = 1.645


@dataclass
class Estimate:
    counted_mature: int
    adjusted_mature: float
    kg: float | None
    kg_low: float | None
    kg_high: float | None
    by_class: dict[str, int] = field(default_factory=dict)
    calibrated: bool = False
    warnings: list[Warning] = field(default_factory=list)


def combine_sides(side_a: int, side_b: int, overlap: float) -> float:
    """Combina los recuentos de ambos lados: ``A + B - overlap * min(A, B)``."""
    if not 0.0 <= overlap <= 1.0:
        raise ValueError(f"overlap debe estar entre 0 y 1: {overlap}")
    if side_a < 0 or side_b < 0:
        raise ValueError("los recuentos no pueden ser negativos")
    return side_a + side_b - overlap * min(side_a, side_b)


def estimate(counts: Mapping[str, float], profile: CropProfile) -> Estimate:
    """Estima kg de fruta madura a partir de recuentos por clase ya combinados."""
    warnings: list[Warning] = []
    by_class = {c: v for c, v in counts.items() if c in profile.mature_ids and v > 0}
    counted = sum(by_class.values())

    k = profile.calibration.factor if profile.calibration else 1.0
    k_rel_sd = (profile.calibration.factor_sd / k) if profile.calibration else 0.0
    if profile.calibration is None:
        warnings.append(
            Warning(
                "SIN_CALIBRAR",
                Severity.MEDIUM,
                f"{profile.label}: sin calibrar frente a conteo manual. Los kg solo incluyen "
                "frutos vistos y tienden a quedarse cortos.",
            )
        )

    missing = sorted(c for c in profile.mature_ids if c not in profile.weights)
    if not profile.weights or any(c in by_class for c in missing):
        warnings.append(
            Warning(
                "SIN_PESO",
                Severity.HIGH,
                f"{profile.label}: falta el peso por fruto de {', '.join(missing)}. "
                "No se calculan kg.",
            )
        )
        return Estimate(round(counted), counted * k, None, None, None,
                        {c: round(v) for c, v in by_class.items()},
                        profile.calibration is not None, warnings)

    grams = 0.0
    sampling_var = 0.0  # Variación fruto a fruto: se reduce al agregar.
    mean_weight_var = 0.0  # Sistemático dentro de cada clase.
    for class_id, n in by_class.items():
        w = profile.weights[class_id]
        n_adj = n * k
        grams += n_adj * w.mean_g
        sampling_var += n_adj * w.sd_g**2
        mean_weight_var += (n_adj * w.standard_error_g) ** 2

    variance = (grams * k_rel_sd) ** 2 + mean_weight_var + sampling_var
    half_width = Z_90 * math.sqrt(variance)
    return Estimate(
        counted_mature=round(counted),
        adjusted_mature=counted * k,
        kg=grams / 1000,
        kg_low=max(0.0, grams - half_width) / 1000,
        kg_high=(grams + half_width) / 1000,
        by_class={c: round(v) for c, v in by_class.items()},
        calibrated=profile.calibration is not None,
        warnings=warnings,
    )


def combine_plant_counts(
    side_counts: Mapping[str, Mapping[str, int]], profile: CropProfile
) -> dict[str, float]:
    """Combina ``{lado: {clase: n}}`` de una planta en ``{clase: n}``."""
    overlap = profile.side_overlap if profile.side_overlap is not None else 1.0
    classes = {c for per_side in side_counts.values() for c in per_side}
    a = side_counts.get("A", {})
    b = side_counts.get("B", {})
    return {c: combine_sides(a.get(c, 0), b.get(c, 0), overlap) for c in classes}


def fit_calibration(
    counted_per_plant: list[float], true_per_plant: list[float], *, seed: int = 0,
    n_boot: int = 500,
) -> tuple[float, float]:
    """Razón de sumas ``real / contado`` y su desviación por bootstrap entre plantas."""
    import numpy as np

    counted = np.asarray(counted_per_plant, dtype=float)
    true = np.asarray(true_per_plant, dtype=float)
    if counted.size != true.size or counted.size == 0:
        raise ValueError("se necesitan listas de igual longitud y no vacías")
    if counted.sum() <= 0:
        raise ValueError("no hay frutos contados con los que calibrar")
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, counted.size, size=(n_boot, counted.size))
    counted_sums = counted[idx].sum(axis=1)
    ratios = true[idx].sum(axis=1)[counted_sums > 0] / counted_sums[counted_sums > 0]
    return float(true.sum() / counted.sum()), float(ratios.std(ddof=1))
