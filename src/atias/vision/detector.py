"""Interfaz del detector y detector de referencia por color.

``ColorBaselineDetector`` solo sirve para vídeo sintético y para depurar la tubería. En un
invernadero real, un fruto verde no se separa de las hojas por color, y los frutos
parcialmente tapados rompen la segmentación. Para el piloto hay que entrenar un detector con
imágenes etiquetadas e implementar esta misma interfaz.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import cv2
import numpy as np


@dataclass(frozen=True)
class Detection:
    x1: int
    y1: int
    x2: int
    y2: int
    score: float = 1.0
    truncated: bool = False  # Toca el borde del encuadre: sus medidas no son fiables.
    # Clase que da el propio detector (id de clase del perfil del cultivo). None si solo detecta.
    label: str | None = None

    @property
    def center(self) -> tuple[float, float]:
        return ((self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2)

    @property
    def size(self) -> float:
        return float(max(self.x2 - self.x1, self.y2 - self.y1))

    @property
    def length_px(self) -> float:
        return self.size

    @property
    def diameter_px(self) -> float:
        return float(min(self.x2 - self.x1, self.y2 - self.y1))


class Detector(Protocol):
    name: str
    trained: bool

    def detect(self, frame: np.ndarray) -> list[Detection]: ...


class ColorBaselineDetector:
    """Segmenta regiones saturadas y brillantes. Solo válido para vídeo sintético."""

    name = "referencia_color"
    trained = False

    def __init__(self, min_saturation: int = 110, min_value: int = 90, min_area: int = 30) -> None:
        self.min_saturation = min_saturation
        self.min_value = min_value
        self.min_area = min_area

    def detect(self, frame: np.ndarray) -> list[Detection]:
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = ((hsv[..., 1] >= self.min_saturation) & (hsv[..., 2] >= self.min_value)).astype(
            np.uint8
        )
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        n, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        height, width = frame.shape[:2]
        detections = []
        for i in range(1, n):
            x, y, w, h, area = stats[i]
            if area < self.min_area:
                continue
            truncated = x <= 0 or y <= 0 or x + w >= width or y + h >= height
            detections.append(Detection(int(x), int(y), int(x + w), int(y + h),
                                        truncated=bool(truncated)))
        return detections
