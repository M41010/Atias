"""Revisión de calidad de un vídeo recibido: no cuenta frutos ni estima kilos.

Avisa de problemas que obligarían a repetir la grabación. Los umbrales son provisionales:
hay que ajustarlos con vídeos reales del invernadero.
"""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from .vision.pipeline import MAX_OVEREXPOSED_SHARE, MIN_MEAN_BRIGHTNESS, MIN_SHARPNESS

MIN_DURATION_SECONDS = 10.0
SAMPLED_FRAMES = 40
UNKNOWN_LENGTH_STEP = 15
ANALYSIS_WIDTH = 640


def _measure(frame: np.ndarray) -> tuple[float, float, float]:
    height, width = frame.shape[:2]
    # La misma escala para todos: la nitidez medida depende de la resolución.
    if width > ANALYSIS_WIDTH:
        frame = cv2.resize(frame, (ANALYSIS_WIDTH, int(height * ANALYSIS_WIDTH / width)))
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return (
        float(gray.mean()),
        float((gray >= 245).mean()),
        float(cv2.Laplacian(gray, cv2.CV_64F).var()),
    )


def review_video(path: str | Path) -> dict:
    """Devuelve las medidas del vídeo y sus avisos. Si no se puede leer, avisa de ello."""
    capture = cv2.VideoCapture(str(path))
    try:
        if not capture.isOpened():
            return {"medidas": None, "avisos": ["ILEGIBLE"]}
        fps = capture.get(cv2.CAP_PROP_FPS)
        total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        step = max(1, total // SAMPLED_FRAMES) if total > 0 else UNKNOWN_LENGTH_STEP
        size = (
            int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)),
            int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        )

        samples = []
        frames = 0
        while capture.grab():
            if frames % step == 0:
                ok, frame = capture.retrieve()
                if ok:
                    samples.append(_measure(frame))
            frames += 1
    finally:
        capture.release()

    if not samples:
        return {"medidas": None, "avisos": ["ILEGIBLE"]}

    brightness, overexposed, sharpness = (
        float(np.median(values)) for values in zip(*samples, strict=True)
    )
    duration = frames / fps if fps > 0 else None
    warnings = []
    if brightness < MIN_MEAN_BRIGHTNESS:
        warnings.append("POCA_LUZ")
    if overexposed > MAX_OVEREXPOSED_SHARE:
        warnings.append("SOBREEXPUESTO")
    if sharpness < MIN_SHARPNESS:
        warnings.append("DESENFOCADO")
    if duration is not None and duration < MIN_DURATION_SECONDS:
        warnings.append("MUY_CORTO")
    return {
        "medidas": {
            "duracionS": round(duration, 1) if duration is not None else None,
            "anchura": size[0],
            "altura": size[1],
            "brillo": round(brightness, 1),
            "sobreexpuesto": round(overexposed, 3),
            "nitidez": round(sharpness, 1),
        },
        "avisos": warnings,
    }
