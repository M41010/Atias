"""Seguimiento entre fotogramas para contar cada fruto una sola vez dentro de una pasada.

Asociación por centro con compensación del movimiento global de cámara, que en un recorrido
lateral domina sobre cualquier movimiento del fruto. Un fruto tapado un instante por una hoja
se mantiene vivo durante ``max_age`` fotogramas para no contarlo dos veces.

No resuelve el doble conteo entre pasadas ni entre lados: eso se trata en ``estimation``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np

from .detector import Detection


@dataclass
class Observation:
    frame: int
    detection: Detection
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class Track:
    id: int
    observations: list[Observation] = field(default_factory=list)
    misses: int = 0

    @property
    def last(self) -> Observation:
        return self.observations[-1]


class CenterTracker:
    def __init__(self, max_age: int = 10, min_hits: int = 4, gate_px: float = 28.0) -> None:
        self.max_age = max_age
        self.min_hits = min_hits
        self.gate_px = gate_px
        self._active: list[Track] = []
        self._finished: list[Track] = []
        self._next_id = 1
        self._motion = np.zeros(2)  # Desplazamiento global estimado por fotograma.

    def update(self, frame: int, detections: list[Detection],
               attributes: list[dict[str, Any]] | None = None) -> None:
        attributes = attributes or [{} for _ in detections]
        centers = [np.array(d.center) for d in detections]

        candidates = []
        for t_idx, track in enumerate(self._active):
            elapsed = frame - track.last.frame
            predicted = np.array(track.last.detection.center) + self._motion * elapsed
            for d_idx, center in enumerate(centers):
                # Tolerancia proporcional al tamaño: el pepino puede cambiar de centro al
                # destaparse más que un tomate cherry.
                gate = max(self.gate_px, 0.5 * detections[d_idx].size)
                distance = float(np.linalg.norm(predicted - center))
                if distance <= gate:
                    candidates.append((distance, t_idx, d_idx))

        used_tracks: set[int] = set()
        used_dets: set[int] = set()
        displacements = []
        for _, t_idx, d_idx in sorted(candidates):
            if t_idx in used_tracks or d_idx in used_dets:
                continue
            used_tracks.add(t_idx)
            used_dets.add(d_idx)
            track = self._active[t_idx]
            elapsed = frame - track.last.frame
            displacements.append((centers[d_idx] - np.array(track.last.detection.center))
                                 / max(elapsed, 1))
            track.observations.append(Observation(frame, detections[d_idx], attributes[d_idx]))
            track.misses = 0

        if displacements:
            self._motion = np.median(np.array(displacements), axis=0)

        survivors = []
        for t_idx, track in enumerate(self._active):
            if t_idx not in used_tracks:
                track.misses += 1
            if track.misses > self.max_age:
                self._finished.append(track)
            else:
                survivors.append(track)
        self._active = survivors

        for d_idx, detection in enumerate(detections):
            if d_idx not in used_dets:
                self._active.append(
                    Track(self._next_id, [Observation(frame, detection, attributes[d_idx])])
                )
                self._next_id += 1

    def finish(self) -> list[Track]:
        """Devuelve los seguimientos confirmados; los muy cortos se descartan como ruido."""
        self._finished.extend(self._active)
        self._active = []
        return [t for t in self._finished if len(t.observations) >= self.min_hits]
