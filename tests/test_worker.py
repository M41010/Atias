import json
import threading
import urllib.error
import urllib.request

import pytest

from atias.worker import create_server


@pytest.fixture
def base_url():
    server = create_server(host="127.0.0.1", port=0)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)


def test_health_reports_ok_and_vision_stack(base_url):
    with urllib.request.urlopen(f"{base_url}/salud", timeout=5) as response:
        body = json.load(response)
        assert response.status == 200
    assert body["estado"] == "ok"
    assert body["opencv"] and body["numpy"]


def test_unknown_route_is_404(base_url):
    with pytest.raises(urllib.error.HTTPError) as error:
        urllib.request.urlopen(f"{base_url}/otra", timeout=5)
    assert error.value.code == 404


# ---- Conteo ----

VIDEO = "0b7c6f6e-6a52-4d4e-9a0e-3f2a1c9b8d71"


@pytest.fixture
def counting(tmp_path, monkeypatch):
    """Servidor con un vídeo sintético y, si se pide, un detector de prueba para el cherry."""
    import cv2
    import numpy as np

    from atias.vision.detector import ColorBaselineDetector

    fourcc = cv2.VideoWriter_fourcc(*"MJPG")
    frames = cv2.VideoWriter(str(tmp_path / "v.avi"), fourcc, 30, (320, 180))
    rng = np.random.default_rng(0)
    world = cv2.cvtColor(cv2.resize(rng.integers(60, 140, (30, 400), dtype=np.uint8), (2400, 180)),
                         cv2.COLOR_GRAY2BGR)
    cv2.circle(world, (900, 90), 12, (0, 0, 220), -1)
    for offset in range(0, 2080, 10):
        frames.write(np.ascontiguousarray(world[:, offset:offset + 320]))
    frames.release()
    (tmp_path / "v.avi").rename(tmp_path / VIDEO)

    server = create_server(
        host="127.0.0.1", port=0, video_dir=tmp_path, models_dir=tmp_path / "modelos"
    )
    state = {"detector": None}
    monkeypatch.setattr(server.detectors, "get", lambda crop: state["detector"])
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}", state, ColorBaselineDetector
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)


def post(url, body):
    headers = {"content-type": "application/json"}
    request = urllib.request.Request(url, json.dumps(body).encode(), headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def test_sin_modelo_del_cultivo_responde_sin_detector(counting):
    url, _, _ = counting
    status, body = post(f"{url}/conteo", {"video": VIDEO, "cultivo": "tomate_cherry", "tramos": 4})
    assert (status, body["error"]) == (503, "sin_detector")


def test_cuenta_por_tramos_con_el_detector_del_cultivo(counting):
    url, state, baseline = counting
    state["detector"] = baseline()
    status, body = post(f"{url}/conteo", {"video": VIDEO, "cultivo": "tomate_cherry", "tramos": 4})
    assert status == 200
    assert body["frutos"] == 1
    assert sum(t["maduros"] for t in body["tramos"]) == body["maduros"]
    assert len(body["tramos"]) == 4


@pytest.mark.parametrize("body", [
    {"video": VIDEO, "cultivo": "fresa", "tramos": 4},
    {"video": VIDEO, "cultivo": "tomate_cherry", "tramos": 0},
    {"video": VIDEO, "cultivo": "tomate_cherry", "tramos": "4"},
    {"video": VIDEO, "cultivo": "tomate_cherry", "tramos": True},
    {"video": "../secreto", "cultivo": "tomate_cherry", "tramos": 4},
])
def test_rechaza_peticiones_no_validas(counting, body):
    url, _, _ = counting
    status, _ = post(f"{url}/conteo", body)
    assert status == 400


def test_video_inexistente_da_404(counting):
    url, _, _ = counting
    status, _ = post(f"{url}/conteo", {"video": "1b7c6f6e-6a52-4d4e-9a0e-3f2a1c9b8d71",
                                       "cultivo": "tomate_cherry", "tramos": 4})
    assert status == 404
