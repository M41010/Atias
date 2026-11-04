"""La revisión de calidad, con vídeos generados de características conocidas."""

import json
import threading
import urllib.error
import urllib.request
import uuid

import cv2
import numpy as np
import pytest

from atias.quality import review_video
from atias.worker import create_server

FPS = 10
SIZE = (320, 180)


def write_video(path, *, seconds=12, brightness=1.0, blur=False, value=None):
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, SIZE)
    rng = np.random.default_rng(1)
    # Textura fija con detalle: se comporta como un cultivo, no como un fondo liso.
    texture = rng.integers(40, 200, (SIZE[1], SIZE[0], 3), dtype=np.uint8)
    for _ in range(int(seconds * FPS)):
        frame = np.full_like(texture, value) if value is not None else texture.copy()
        if blur:
            frame = cv2.GaussianBlur(frame, (41, 41), 0)
        writer.write(np.clip(frame * brightness, 0, 255).astype(np.uint8))
    writer.release()
    return path


def test_good_video_has_no_warnings(tmp_path):
    result = review_video(write_video(tmp_path / "ok.mp4"))
    assert result["avisos"] == []
    assert result["medidas"]["anchura"] == 320
    assert result["medidas"]["duracionS"] == pytest.approx(12, abs=0.5)


@pytest.mark.parametrize(
    ("options", "warning"),
    [
        ({"brightness": 0.15}, "POCA_LUZ"),
        ({"value": 255}, "SOBREEXPUESTO"),
        ({"blur": True}, "DESENFOCADO"),
        ({"seconds": 3}, "MUY_CORTO"),
    ],
)
def test_detects_each_problem(tmp_path, options, warning):
    assert warning in review_video(write_video(tmp_path / "v.mp4", **options))["avisos"]


def test_file_that_is_not_a_video_is_reported(tmp_path):
    path = tmp_path / "falso.mp4"
    path.write_bytes(b"esto no es un video" * 100)
    assert review_video(path) == {"medidas": None, "avisos": ["ILEGIBLE"]}


def test_missing_file_is_reported(tmp_path):
    assert review_video(tmp_path / "no.mp4")["avisos"] == ["ILEGIBLE"]


@pytest.fixture
def service(tmp_path):
    server = create_server(host="127.0.0.1", port=0, video_dir=tmp_path)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}", tmp_path
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)


def post(url, body):
    data = body if isinstance(body, bytes) else json.dumps(body).encode()
    request = urllib.request.Request(f"{url}/calidad", data=data, method="POST")
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.status, json.load(response)


def test_service_reviews_a_video_by_id(service):
    url, folder = service
    video_id = str(uuid.uuid4())
    write_video(folder / f"{video_id}.mp4")
    (folder / f"{video_id}.mp4").rename(folder / video_id)
    status, body = post(url, {"video": video_id})
    assert status == 200
    assert body["avisos"] == []


@pytest.mark.parametrize(
    "body", [{"video": "../../etc/passwd"}, {"video": "a/b"}, {"video": 3}, {}, b"{no es json"]
)
def test_service_rejects_invalid_requests(service, body):
    url, _ = service
    with pytest.raises(urllib.error.HTTPError) as error:
        post(url, body)
    assert error.value.code == 400


def test_service_reports_missing_video(service):
    url, _ = service
    with pytest.raises(urllib.error.HTTPError) as error:
        post(url, {"video": str(uuid.uuid4())})
    assert error.value.code == 404
