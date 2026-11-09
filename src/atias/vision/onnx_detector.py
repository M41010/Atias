"""Detector entrenado (RF-DETR exportado a ONNX) para ejecutarlo sin GPU.

El modelo se entrena en Colab con ``notebooks/entrenar_detector.ipynb``, que deja en una carpeta:

- ``modelo.onnx``: la red exportada.
- ``modelo.json``: cómo usarla. Ejemplo::

    {
      "nombre": "rfdetr-medium-cherry-2026-11-12",
      "cultivo": "tomate_cherry",
      "resolucion": 576,
      "clases": ["verde", "pinton", "rojizo", "maduro"],
      "equivalencias": {"verde": "inmaduro", "pinton": "inmaduro",
                        "rojizo": "rojo", "maduro": "rojo"},
      "umbral": 0.5,
      "teselas": [2, 2],
      "solape": 0.15,
      "ancho_max": 1920
    }

``clases`` son las del modelo en su orden; ``equivalencias`` las convierte en las clases del perfil
del cultivo. Así, si la empresa usa otro criterio de madurez, se cambia aquí sin volver a entrenar.
Una clase que equivale a ``null`` solo dice dónde hay un fruto: su madurez la decide el color
(modo «fruto + color», útil mientras falten imágenes etiquetadas de fruta madura).

Un fotograma 4K entero reducido a la resolución del modelo deja un tomate cherry en pocos píxeles,
así que el fotograma se divide en teselas que se solapan, y lo detectado dos veces en el solape
se une.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

import cv2
import numpy as np

from .detector import Detection

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
# Dos cajas de teselas vecinas con más solape que esto son el mismo fruto.
MERGE_IOU = 0.5


class Session(Protocol):
    """Lo que se usa de ``onnxruntime.InferenceSession``; las pruebas pasan una falsa."""

    def run(self, output_names: Any, inputs: dict[str, np.ndarray]) -> list[np.ndarray]: ...

    def get_outputs(self) -> list[Any]: ...


@dataclass(frozen=True)
class ModelConfig:
    name: str
    crop: str
    resolution: int
    classes: tuple[str, ...]
    equivalences: dict[str, str | None]
    threshold: float = 0.5
    tiles: tuple[int, int] = (2, 2)
    overlap: float = 0.15
    max_width: int = 1920

    @staticmethod
    def load(path: str | Path) -> ModelConfig:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        classes = tuple(data["clases"])
        equivalences = (
            dict(data["equivalencias"]) if "equivalencias" in data else {c: c for c in classes}
        )
        missing = [c for c in classes if c not in equivalences]
        if missing:
            raise ValueError(f"Faltan equivalencias para: {', '.join(missing)}")
        tiles = tuple(data.get("teselas", (2, 2)))
        if len(tiles) != 2 or min(tiles) < 1:
            raise ValueError("teselas debe ser [columnas, filas]")
        return ModelConfig(
            name=data["nombre"],
            crop=data["cultivo"],
            resolution=int(data["resolucion"]),
            classes=classes,
            equivalences=equivalences,
            threshold=float(data.get("umbral", 0.5)),
            tiles=(int(tiles[0]), int(tiles[1])),
            overlap=float(data.get("solape", 0.15)),
            max_width=int(data.get("ancho_max", 1920)),
        )


def tile_boxes(
    width: int, height: int, cols: int, rows: int, overlap: float
) -> list[tuple[int, int, int, int]]:
    """Recortes (x1, y1, x2, y2) que cubren el fotograma, con solape entre vecinos."""
    tile_w = width / (cols - (cols - 1) * overlap) if cols > 1 else width
    tile_h = height / (rows - (rows - 1) * overlap) if rows > 1 else height
    step_x = tile_w * (1 - overlap)
    step_y = tile_h * (1 - overlap)
    boxes = []
    for row in range(rows):
        for col in range(cols):
            x1 = round(col * step_x)
            y1 = round(row * step_y)
            x2 = width if col == cols - 1 else round(x1 + tile_w)
            y2 = height if row == rows - 1 else round(y1 + tile_h)
            boxes.append((x1, y1, x2, y2))
    return boxes


def _iou(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    x1 = np.maximum(a[0], b[:, 0])
    y1 = np.maximum(a[1], b[:, 1])
    x2 = np.minimum(a[2], b[:, 2])
    y2 = np.minimum(a[3], b[:, 3])
    inter = np.clip(x2 - x1, 0, None) * np.clip(y2 - y1, 0, None)
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[:, 2] - b[:, 0]) * (b[:, 3] - b[:, 1])
    return inter / np.maximum(area_a + area_b - inter, 1e-9)


def merge_duplicates(boxes: np.ndarray, scores: np.ndarray, iou: float = MERGE_IOU) -> list[int]:
    """Índices a conservar: de cada grupo de cajas solapadas, la de más confianza."""
    order = list(np.argsort(-scores))
    keep = []
    while order:
        best = order.pop(0)
        keep.append(int(best))
        if not order:
            break
        rest = np.array(order)
        overlaps = _iou(boxes[best], boxes[rest])
        order = [int(i) for i, o in zip(rest, overlaps, strict=True) if o < iou]
    return keep


def postprocess(
    dets: np.ndarray, logits: np.ndarray, n_classes: int, threshold: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Salida cruda de RF-DETR (una imagen) a cajas normalizadas xyxy, confianza y clase.

    ``dets``: (consultas, 4) en cxcywh normalizado. ``logits``: (consultas, clases + 1) sin activar;
    con clases propias, la última posición es el fondo y se descarta.
    """
    probs = 1 / (1 + np.exp(-logits[:, :n_classes]))
    class_ids = probs.argmax(axis=1)
    scores = probs.max(axis=1)
    keep = scores >= threshold
    cx, cy, w, h = dets[keep].T
    boxes = np.stack([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], axis=1)
    return np.clip(boxes, 0, 1), scores[keep], class_ids[keep]


class OnnxDetector:
    trained = True

    def __init__(self, config: ModelConfig, session: Session) -> None:
        self.config = config
        self.name = config.name
        self._session = session
        names = [o.name for o in session.get_outputs()]
        # Se busca por nombre: por forma se confunden cuando hay 3 clases.
        if "dets" not in names or "labels" not in names:
            raise ValueError(f"El modelo no tiene las salidas dets y labels: {names}")
        self._outputs = ["dets", "labels"]

    @staticmethod
    def from_directory(directory: str | Path) -> OnnxDetector:
        import onnxruntime as ort  # Solo hace falta si hay modelo.

        ort.disable_telemetry_events()
        directory = Path(directory)
        config = ModelConfig.load(directory / "modelo.json")
        session = ort.InferenceSession(
            str(directory / "modelo.onnx"), providers=["CPUExecutionProvider"]
        )
        return OnnxDetector(config, session)

    def _prepare(self, tile_bgr: np.ndarray) -> np.ndarray:
        size = self.config.resolution
        rgb = cv2.cvtColor(
            cv2.resize(tile_bgr, (size, size), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB
        )
        normalized = (rgb.astype(np.float32) / 255.0 - IMAGENET_MEAN) / IMAGENET_STD
        return normalized.transpose(2, 0, 1)[None]

    def detect(self, frame: np.ndarray) -> list[Detection]:
        config = self.config
        height, width = frame.shape[:2]
        scale = min(1.0, config.max_width / width)
        if scale < 1.0:
            frame = cv2.resize(
                frame, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA
            )
        h, w = frame.shape[:2]

        all_boxes, all_scores, all_classes, all_cut = [], [], [], []
        for x1, y1, x2, y2 in tile_boxes(w, h, *config.tiles, config.overlap):
            dets, logits = self._session.run(
                self._outputs, {"input": self._prepare(frame[y1:y2, x1:x2])}
            )
            boxes, scores, classes = postprocess(
                dets[0], logits[0], len(config.classes), config.threshold
            )
            tw, th = x2 - x1, y2 - y1
            for box, score, class_id in zip(boxes, scores, classes, strict=True):
                bx1, by1, bx2, by2 = box * [tw, th, tw, th] + [x1, y1, x1, y1]
                # Cortado por el borde de la tesela, pero no del fotograma: otra tesela lo
                # verá entero.
                touches = (
                    (box[0] <= 0.005 and x1 > 0)
                    or (box[2] >= 0.995 and x2 < w)
                    or (box[1] <= 0.005 and y1 > 0)
                    or (box[3] >= 0.995 and y2 < h)
                )
                all_boxes.append([bx1, by1, bx2, by2])
                all_scores.append(float(score) * (0.9 if touches else 1.0))
                all_classes.append(int(class_id))
                all_cut.append(bx1 <= 1 or by1 <= 1 or bx2 >= w - 1 or by2 >= h - 1)
        if not all_boxes:
            return []

        boxes = np.array(all_boxes, dtype=np.float32)
        keep = merge_duplicates(boxes, np.array(all_scores))
        detections = []
        for i in keep:
            bx1, by1, bx2, by2 = boxes[i] / scale
            model_class = config.classes[all_classes[i]]
            detections.append(
                Detection(
                    int(bx1),
                    int(by1),
                    int(round(bx2)),
                    int(round(by2)),
                    score=all_scores[i],
                    truncated=all_cut[i],
                    label=config.equivalences[model_class],
                )
            )
        return detections
