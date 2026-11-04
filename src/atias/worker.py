"""Servicio de análisis, accesible solo desde la API.

Por ahora revisa la calidad de los vídeos recibidos. No cuenta frutos: aún no hay detector.
Usa la biblioteca estándar para no añadir un framework web sin necesidad.
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

from .quality import review_video

DEFAULT_PORT = 8000
MAX_BODY_BYTES = 1024
# El nombre de archivo es siempre un UUID: impide salir de la carpeta de vídeos.
VIDEO_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - nombre impuesto por http.server
        if self.path == "/salud":
            self._reply(200, {"estado": "ok", "opencv": cv2.__version__, "numpy": np.__version__})
        else:
            self._reply(404, {"error": "Ruta no encontrada"})

    def do_POST(self) -> None:  # noqa: N802 - nombre impuesto por http.server
        if self.path != "/calidad":
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
        self._reply(200, review_video(path))

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


def create_server(
    host: str = "0.0.0.0", port: int = DEFAULT_PORT, video_dir: str | Path = "."
) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), Handler)
    server.video_dir = Path(video_dir)
    return server


def main() -> None:
    server = create_server(
        port=int(os.environ.get("PORT", DEFAULT_PORT)),
        video_dir=os.environ.get("VIDEO_DIR", "./videos"),
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
