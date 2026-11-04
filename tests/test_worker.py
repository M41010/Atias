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
