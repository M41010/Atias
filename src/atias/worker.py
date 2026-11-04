"""Servicio de análisis. De momento solo informa de su estado: el trabajo de vídeo aún no se expone.

Usa la biblioteca estándar para no añadir un framework web antes de decidir cómo lo llamará Express.
"""

from __future__ import annotations

import json
import os
import signal
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import cv2
import numpy as np

DEFAULT_PORT = 8000


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - nombre impuesto por http.server
        if self.path == "/salud":
            self._reply(200, {"estado": "ok", "opencv": cv2.__version__, "numpy": np.__version__})
        else:
            self._reply(404, {"error": "Ruta no encontrada"})

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


def create_server(host: str = "0.0.0.0", port: int = DEFAULT_PORT) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), Handler)


def main() -> None:
    server = create_server(port=int(os.environ.get("PORT", DEFAULT_PORT)))

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
