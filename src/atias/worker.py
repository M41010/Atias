"""Servicio de análisis, accesible solo desde la API.

- ``POST /calidad``: revisa luz, nitidez y duración de un vídeo recibido.
- ``POST /grabacion``: lee de los metadatos del vídeo cuándo se grabó. Solo lee las cabeceras.
- ``POST /conteo``: cuenta los frutos de un vídeo por tramo y clase con el detector entrenado del
  cultivo. Si aún no hay modelo para ese cultivo responde 503 ``sin_detector``.

Los modelos están en ``ATIAS_MODELOS/<cultivo>/`` (``modelo.onnx`` y ``modelo.json``), tal como los
deja ``notebooks/entrenar_detector.ipynb``. Usa la biblioteca estándar para no añadir un framework
web sin necesidad.
"""

from __future__ import annotations

import json
import os
import re
import signal
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import cv2
import numpy as np

from .domain import CropProfile, load_profiles
from .quality import review_video
from .recording import recording_time
from .vision.onnx_detector import OnnxDetector
from .vision.rows import RowVideoError, analyze_row_video

DEFAULT_PORT = 8000
MAX_BODY_BYTES = 1024
MAX_TRAMOS = 50
# El nombre de archivo es siempre un UUID: impide salir de la carpeta de vídeos.
VIDEO_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)
DEFAULT_PROFILES = Path(__file__).resolve().parents[2] / "config" / "cultivos.plantilla.json"


class Detectors:
    """Carga cada modelo la primera vez que se pide y lo reutiliza. Un modelo nuevo en la carpeta
    se detecta sin reiniciar: se comprueba la fecha del archivo."""

    def __init__(self, directory: Path | None) -> None:
        self.directory = directory
        self._loaded: dict[str, tuple[float, OnnxDetector]] = {}
        self._lock = threading.Lock()

    def get(self, crop: str) -> OnnxDetector | None:
        if self.directory is None:
            return None
        folder = self.directory / crop
        model = folder / "modelo.onnx"
        if not model.is_file() or not (folder / "modelo.json").is_file():
            return None
        stamp = model.stat().st_mtime
        with self._lock:
            cached = self._loaded.get(crop)
            if cached is None or cached[0] != stamp:
                detector = OnnxDetector.from_directory(folder)
                if detector.config.crop != crop:
                    raise ValueError(f"El modelo de {folder} es de {detector.config.crop}")
                self._loaded[crop] = (stamp, detector)
            return self._loaded[crop][1]

    def available(self) -> list[str]:
        if self.directory is None or not self.directory.is_dir():
            return []
        return sorted(p.name for p in self.directory.iterdir() if (p / "modelo.onnx").is_file())


class Handler(BaseHTTPRequestHandler):
    server: AnalysisServer

    def do_GET(self) -> None:  # noqa: N802 - nombre impuesto por http.server
        if self.path == "/salud":
            self._reply(200, {
                "estado": "ok",
                "opencv": cv2.__version__,
                "numpy": np.__version__,
                "detectores": self.server.detectors.available(),
            })
        else:
            self._reply(404, {"error": "Ruta no encontrada"})

    def do_POST(self) -> None:  # noqa: N802 - nombre impuesto por http.server
        if self.path not in ("/calidad", "/grabacion", "/conteo"):
            self._reply(404, {"error": "Ruta no encontrada"})
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > MAX_BODY_BYTES:
                self._reply(413, {"error": "Petición demasiado grande"})
                return
            body = json.loads(self.rfile.read(length))
            video_id = body["video"]
        except (ValueError, KeyError, TypeError):
            self._reply(400, {"error": "Petición no válida"})
            return
        if not isinstance(video_id, str) or not VIDEO_ID.match(video_id):
            self._reply(400, {"error": "Identificador no válido"})
            return
        path = self.server.video_dir / video_id
        if not path.is_file():
            self._reply(404, {"error": "Vídeo no encontrado"})
            return
        if self.path == "/calidad":
            self._reply(200, review_video(path))
        elif self.path == "/grabacion":
            self._reply(200, recording_time(path))
        else:
            self._count(path, body)

    def _count(self, path: Path, body: dict) -> None:
        crop = body.get("cultivo")
        tramos = body.get("tramos")
        profile: CropProfile | None = (
            self.server.profiles.get(crop) if isinstance(crop, str) else None
        )
        if profile is None or not isinstance(tramos, int) or isinstance(tramos, bool) \
                or not 1 <= tramos <= MAX_TRAMOS:
            self._reply(400, {"error": "Cultivo o tramos no válidos"})
            return
        try:
            detector = self.server.detectors.get(profile.crop)
        except (OSError, ValueError) as error:
            print(f"No se pudo cargar el modelo de {profile.crop}: {error}", flush=True)
            self._reply(500, {"error": "Modelo no válido"})
            return
        if detector is None:
            self._reply(503, {"error": "sin_detector"})
            return
        # Un conteo usa toda la CPU disponible: de uno en uno.
        with self.server.counting:
            try:
                result = analyze_row_video(path, profile, detector, tramos)
            except RowVideoError:
                self._reply(422, {"error": "Vídeo ilegible"})
                return
        self._reply(200, result.to_dict(profile))

    def _reply(self, status: int, body: dict) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:
        # Las comprobaciones de estado llegan cada pocos segundos y taparían el resto del registro.
        pass


class AnalysisServer(ThreadingHTTPServer):
    video_dir: Path
    profiles: dict[str, CropProfile]
    detectors: Detectors
    counting: threading.Lock


def create_server(
    host: str = "0.0.0.0",
    port: int = DEFAULT_PORT,
    video_dir: str | Path = ".",
    models_dir: str | Path | None = None,
    profiles_path: str | Path = DEFAULT_PROFILES,
) -> AnalysisServer:
    server = AnalysisServer((host, port), Handler)
    server.video_dir = Path(video_dir)
    server.profiles = load_profiles(profiles_path)
    server.detectors = Detectors(Path(models_dir) if models_dir else None)
    server.counting = threading.Lock()
    return server


def main() -> None:
    server = create_server(
        port=int(os.environ.get("PORT", DEFAULT_PORT)),
        video_dir=os.environ.get("VIDEO_DIR", "./videos"),
        models_dir=os.environ.get("ATIAS_MODELOS") or None,
        profiles_path=os.environ.get("ATIAS_CULTIVOS", DEFAULT_PROFILES),
    )

    def stop(*_: object) -> None:
        # shutdown() se bloquea si se llama desde el hilo que atiende: va en otro hilo.
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    print(f"Análisis escuchando en el puerto {server.server_address[1]}", flush=True)
    server.serve_forever()
    server.server_close()


if __name__ == "__main__":
    main()
