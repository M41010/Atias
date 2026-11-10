"""Cálculo y comprobación del objetivo de error (≤ 10 % en kg por invernadero).

Unidad de medida: un par (invernadero, cultivo, semana)::

    error_pct = |kg_estimado - kg_real| / kg_real * 100

Métrica principal propuesta: WAPE = suma|E - R| / suma(R), que no se dispara con cosechas
pequeñas. Se acompaña de sesgo, P90 y % de pares dentro del objetivo porque una media buena
puede ocultar semanas muy malas.

El veredicto es deliberadamente conservador: solo puede ser ``CUMPLE_EN_PILOTO`` con datos
medidos, comparables, fuera de muestra, en cantidad suficiente y con el extremo superior
del intervalo de confianza por debajo del objetivo.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import StrEnum

import numpy as np

from .domain import HarvestScope, Origin, Semantics

TARGET = 0.10
# Criterio confirmado por el usuario el 2026-11-10 (ver docs/VALIDACION.md).
DEFAULT_MIN_PAIRS = 8


class Verdict(StrEnum):
    NO_DATA = "SIN_DATOS"
    SIMULATED = "NO_VALIDO_DATOS_SIMULADOS"
    NOT_COMPARABLE = "NO_COMPARABLE"
    INSUFFICIENT = "MUESTRA_INSUFICIENTE"
    NOT_MET = "NO_CUMPLE"
    MET = "CUMPLE_EN_PILOTO"


VERDICT_TEXT = {
    Verdict.NO_DATA: "Aún no hay pares de estimación y cosecha real que evaluar.",
    Verdict.SIMULATED: "Datos simulados: este error comprueba el cálculo y no dice nada "
    "sobre la precisión real del sistema.",
    Verdict.NOT_COMPARABLE: "La fruta observada el día de captura no es comparable con la "
    "recolección lunes–viernes, que incluye fruta madurada después.",
    Verdict.INSUFFICIENT: "Datos reales insuficientes para concluir.",
    Verdict.NOT_MET: "Con estos datos no se puede afirmar que se alcance el objetivo.",
    Verdict.MET: "Objetivo alcanzado en este piloto. No extrapolar a otros invernaderos, "
    "cultivos o métodos de captura sin validarlos.",
}


def is_comparable(semantics: Semantics, scope: HarvestScope) -> bool:
    return (semantics, scope) in {
        (Semantics.OBSERVED, HarvestScope.IMMEDIATE),
        (Semantics.FORECAST_MON_FRI, HarvestScope.MON_FRI),
    }


@dataclass(frozen=True)
class Pair:
    greenhouse: str
    crop: str
    week: str
    estimated_kg: float
    real_kg: float
    semantics: Semantics
    scope: HarvestScope
    origin: Origin
    out_of_sample: bool

    @property
    def error_pct(self) -> float | None:
        if self.real_kg <= 0:
            return None
        return abs(self.estimated_kg - self.real_kg) / self.real_kg * 100


@dataclass
class Report:
    verdict: Verdict
    message: str
    n_pairs: int = 0
    n_excluded: int = 0
    wape_pct: float | None = None
    wape_ci90_pct: tuple[float, float] | None = None
    mape_pct: float | None = None
    p90_ape_pct: float | None = None
    within_target_pct: float | None = None
    bias_pct: float | None = None

    def to_dict(self) -> dict:
        return {**asdict(self), "verdict": self.verdict.value}


def _wape(est: np.ndarray, real: np.ndarray) -> float:
    return float(np.abs(est - real).sum() / real.sum() * 100)


def evaluate(
    pairs: list[Pair], *, target: float = TARGET, min_pairs: int = DEFAULT_MIN_PAIRS,
    seed: int = 0, n_boot: int = 2000,
) -> Report:
    # Sin cosecha real positiva el error relativo no está definido, y lo calibrado con esos
    # mismos datos daría un resultado optimista: ambos casos quedan fuera de la métrica.
    usable = [p for p in pairs if p.real_kg > 0 and p.out_of_sample]
    excluded = len(pairs) - len(usable)
    if not usable:
        verdict = Verdict.SIMULATED if any(p.origin == Origin.SIMULATED for p in pairs) \
            else Verdict.NO_DATA
        return Report(verdict, VERDICT_TEXT[verdict], n_excluded=excluded)

    comparable = [p for p in usable if is_comparable(p.semantics, p.scope)]
    all_comparable = len(comparable) == len(usable)

    est = np.array([p.estimated_kg for p in usable])
    real = np.array([p.real_kg for p in usable])
    ape = np.abs(est - real) / real * 100
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(usable), size=(n_boot, len(usable)))
    boot = np.abs(est[idx] - real[idx]).sum(axis=1) / real[idx].sum(axis=1) * 100
    low, high = np.percentile(boot, [5, 95])
    wape = _wape(est, real)

    if any(p.origin == Origin.SIMULATED for p in usable):
        verdict = Verdict.SIMULATED
    elif not all_comparable:
        verdict = Verdict.NOT_COMPARABLE
    elif len(usable) < min_pairs:
        verdict = Verdict.INSUFFICIENT
    elif high <= target * 100:
        verdict = Verdict.MET
    else:
        verdict = Verdict.NOT_MET

    return Report(
        verdict=verdict,
        message=VERDICT_TEXT[verdict],
        n_pairs=len(usable),
        n_excluded=excluded,
        wape_pct=wape,
        wape_ci90_pct=(float(low), float(high)),
        mape_pct=float(ape.mean()),
        p90_ape_pct=float(np.percentile(ape, 90)),
        within_target_pct=float((ape <= target * 100).mean() * 100),
        bias_pct=float((est - real).sum() / real.sum() * 100),
    )
