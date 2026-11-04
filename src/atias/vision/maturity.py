"""Clasificación de un fruto por color (tomate, pimiento) o calibre (pepino)."""

from __future__ import annotations

from collections import Counter

import cv2
import numpy as np

from ..domain import CropProfile, FruitClass
from .detector import Detection

UNCLASSIFIED = "sin_clasificar"


def classify_color(frame: np.ndarray, detection: Detection, profile: CropProfile,
                   min_share: float = 0.5) -> str:
    """Devuelve la clase cuyo tono domina en el centro del fruto.

    Solo mira una elipse central para reducir el efecto de hojas y fondo dentro de la caja.
    """
    crop = frame[detection.y1:detection.y2, detection.x1:detection.x2]
    if crop.size == 0:
        return UNCLASSIFIED
    height, width = crop.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    axes = (max(1, int(width * 0.4)), max(1, int(height * 0.4)))
    cv2.ellipse(mask, (width // 2, height // 2), axes, 0, 0, 360, 1, -1)
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    valid = (mask == 1) & (hsv[..., 1] >= 60) & (hsv[..., 2] >= 50)
    hues = hsv[..., 0][valid]
    if hues.size == 0:
        return UNCLASSIFIED

    best_id, best_share = UNCLASSIFIED, 0.0
    for fruit_class in profile.classes:
        share = sum(
            np.count_nonzero((hues >= low) & (hues <= high))
            for low, high in fruit_class.hue_ranges
        ) / hues.size
        if share > best_share:
            best_id, best_share = fruit_class.id, share
    return best_id if best_share >= min_share else UNCLASSIFIED


def _in_range(value: float, bounds: tuple[float, float] | None) -> bool:
    return bounds is None or bounds[0] <= value < bounds[1]


def classify_caliber(length_mm: float | None, diameter_mm: float | None,
                     classes: tuple[FruitClass, ...]) -> str:
    """Asigna clase de calibre. Sin referencia de escala no se puede: ``sin_clasificar``."""
    if length_mm is None:
        return UNCLASSIFIED
    for fruit_class in classes:
        # Una clase sin umbrales aún no está definida: no debe capturar todos los frutos.
        if fruit_class.length_mm is None and fruit_class.diameter_mm is None:
            continue
        needs_diameter = fruit_class.diameter_mm is not None
        if needs_diameter and diameter_mm is None:
            continue
        if _in_range(length_mm, fruit_class.length_mm) and (
            not needs_diameter or _in_range(diameter_mm, fruit_class.diameter_mm)
        ):
            return fruit_class.id
    return UNCLASSIFIED


def vote_color(labels: list[str]) -> str:
    """Clase mayoritaria a lo largo del seguimiento, ignorando fotogramas sin clasificar."""
    clean = [c for c in labels if c != UNCLASSIFIED]
    return Counter(clean).most_common(1)[0][0] if clean else UNCLASSIFIED


def track_caliber_mm(lengths: list[float], diameters: list[float]) -> tuple[float | None,
                                                                            float | None]:
    """Medida representativa del fruto a lo largo del seguimiento.

    Una hoja solo puede acortar la longitud aparente, nunca alargarla: por eso se usa un
    percentil alto en lugar de la media.
    """
    length = float(np.percentile(lengths, 90)) if lengths else None
    diameter = float(np.median(diameters)) if diameters else None
    return length, diameter
