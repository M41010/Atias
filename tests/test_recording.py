"""Fecha de grabación leída de las cajas MP4/MOV, con archivos construidos a mano."""

import json
import shutil
import struct
import subprocess
import threading
import urllib.request
from datetime import UTC, datetime

import pytest

from atias.recording import recording_time
from atias.worker import create_server

NOW = datetime(2026, 11, 16, 12, 0, tzinfo=UTC)
MAC_EPOCH = datetime(1904, 1, 1, tzinfo=UTC)


def box(kind: bytes, payload: bytes = b"") -> bytes:
    return struct.pack(">I", 8 + len(payload)) + kind + payload


def mvhd(moment: datetime | None, version: int = 0) -> bytes:
    seconds = int((moment - MAC_EPOCH).total_seconds()) if moment else 0
    if version == 1:
        return box(b"mvhd", bytes([1, 0, 0, 0]) + struct.pack(">QQ", seconds, seconds) + bytes(80))
    return box(b"mvhd", bytes(4) + struct.pack(">II", seconds, seconds) + bytes(88))


def apple_meta(text: str) -> bytes:
    key = b"com.apple.quicktime.creationdate"
    entry = struct.pack(">I", 8 + len(key)) + b"mdta" + key
    keys = box(b"keys", bytes(4) + struct.pack(">I", 1) + entry)
    data = box(b"data", struct.pack(">II", 1, 0) + text.encode())
    ilst = box(b"ilst", box(struct.pack(">I", 1), data))
    return box(b"meta", box(b"hdlr", bytes(24)) + keys + ilst)


def day_atom(text: str) -> bytes:
    raw = text.encode()
    return box(b"udta", box(b"\xa9day", struct.pack(">HH", len(raw), 0) + raw))


def write(tmp_path, *moov_children: bytes, moov_first: bool = False, name: str = "v.mp4"):
    ftyp = box(b"ftyp", b"isom" + bytes(4) + b"isommp41")
    mdat = box(b"mdat", bytes(1000))
    moov = box(b"moov", b"".join(moov_children))
    path = tmp_path / name
    path.write_bytes(ftyp + (moov + mdat if moov_first else mdat + moov))
    return path


def test_lee_creation_time_de_mvhd_en_utc(tmp_path):
    path = write(tmp_path, mvhd(datetime(2026, 11, 14, 8, 12, 33, tzinfo=UTC)))
    assert recording_time(path, NOW) == {"fecha": "2026-11-14T08:12:33Z", "fuente": "metadatos"}


def test_mvhd_version_1_y_moov_al_principio(tmp_path):
    path = write(tmp_path, mvhd(datetime(2026, 11, 14, 9, 0, tzinfo=UTC), 1), moov_first=True)
    assert recording_time(path, NOW)["fecha"] == "2026-11-14T09:00:00Z"


def test_prefiere_la_fecha_del_iphone_con_su_zona_horaria(tmp_path):
    path = write(
        tmp_path,
        mvhd(datetime(2026, 11, 15, 22, 0, tzinfo=UTC)),
        apple_meta("2026-11-14T09:12:33+0100"),
    )
    assert recording_time(path, NOW)["fecha"] == "2026-11-14T08:12:33Z"


def test_usa_day_si_no_hay_otra(tmp_path):
    path = write(tmp_path, mvhd(None), day_atom("2026-11-14T10:00:00+01:00"))
    assert recording_time(path, NOW)["fecha"] == "2026-11-14T09:00:00Z"


@pytest.mark.parametrize(
    "moment", [None, datetime(1970, 1, 1, tzinfo=UTC), datetime(2027, 1, 1, tzinfo=UTC)]
)
def test_descarta_fechas_vacias_o_imposibles(tmp_path, moment):
    path = write(tmp_path, mvhd(moment))
    assert recording_time(path, NOW) == {"fecha": None, "fuente": None}


def test_archivo_que_no_es_un_video_o_no_existe(tmp_path):
    other = tmp_path / "falso.mp4"
    other.write_bytes(b"esto no es un video" * 100)
    assert recording_time(other, NOW)["fecha"] is None
    assert recording_time(tmp_path / "no.mp4", NOW)["fecha"] is None


def test_cajas_cortadas_no_rompen_la_lectura(tmp_path):
    path = write(tmp_path, mvhd(datetime(2026, 11, 14, tzinfo=UTC)))
    path.write_bytes(path.read_bytes()[:-20])
    assert recording_time(path, NOW)["fecha"] is None


def test_el_servicio_responde_la_fecha_de_un_video(tmp_path):
    video_id = "0b7c6f6e-6a52-4d4e-9a0e-3f2a1c9b8d71"
    write(tmp_path, mvhd(datetime(2026, 11, 7, 8, 0, tzinfo=UTC)), name=video_id)
    server = create_server(host="127.0.0.1", port=0, video_dir=tmp_path)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        request = urllib.request.Request(
            f"http://127.0.0.1:{server.server_address[1]}/grabacion",
            json.dumps({"video": video_id}).encode(),
            {"content-type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            body = json.load(response)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
    assert body == {"fecha": "2026-11-07T08:00:00Z", "fuente": "metadatos"}


@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg no está instalado")
def test_video_real_de_ffmpeg(tmp_path):
    path = tmp_path / "f.mp4"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=green:s=64x64:d=1",
         "-metadata", "creation_time=2026-11-07T08:30:00Z", str(path)],
        check=True,
    )
    assert recording_time(path, NOW)["fecha"] == "2026-11-07T08:30:00Z"
