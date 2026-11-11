"""Fecha y hora en que se grabó un vídeo, leída de los metadatos del propio archivo.

Los móviles guardan vídeos MP4, MOV o 3GP: todos usan cajas ISO BMFF / QuickTime. Se leen solo las
cabeceras, sin decodificar la imagen ni depender de ffprobe. Orden de preferencia:

1. ``com.apple.quicktime.creationdate`` (iPhone): hora local con su zona horaria.
2. ``©day`` en ``udta``: algunos móviles la escriben, con o sin zona.
3. ``creation_time`` de ``mvhd``: segundos desde 1904 en UTC. Algunos Android escriben aquí la hora
   local como si fuera UTC; no hay forma de saberlo desde el archivo.

Copiar el vídeo por Drive, USB o WhatsApp como documento cambia la fecha del archivo en el
ordenador, pero normalmente conserva estas cajas. WhatsApp como vídeo (recomprimido) las pierde.
"""

from __future__ import annotations

import struct
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import BinaryIO

MAC_EPOCH = datetime(1904, 1, 1, tzinfo=UTC)
# Por debajo es un valor vacío o mal escrito; por encima, el reloj del móvil estaba mal.
EARLIEST = datetime(2015, 1, 1, tzinfo=UTC)
FUTURE_MARGIN = timedelta(days=2)
MAX_MOOV_BYTES = 64 * 1024**2


def _boxes(data: bytes, start: int = 0, end: int | None = None):
    """Recorre las cajas de un bloque ya leído: (tipo, inicio del contenido, fin)."""
    end = len(data) if end is None else end
    pos = start
    while pos + 8 <= end:
        size, kind = struct.unpack(">I4s", data[pos:pos + 8])
        header = 8
        if size == 1:
            if pos + 16 > end:
                return
            size = struct.unpack(">Q", data[pos + 8:pos + 16])[0]
            header = 16
        elif size == 0:
            size = end - pos
        if size < header or pos + size > end:
            return
        yield kind, pos + header, pos + size
        pos += size


def _read_moov(handle: BinaryIO) -> bytes | None:
    """Busca moov entre las cajas de primer nivel saltando las demás (mdat puede ocupar gigas)."""
    handle.seek(0, 2)
    total = handle.tell()
    pos = 0
    while pos + 8 <= total:
        handle.seek(pos)
        head = handle.read(16)
        if len(head) < 8:
            return None
        size, kind = struct.unpack(">I4s", head[:8])
        header = 8
        if size == 1:
            if len(head) < 16:
                return None
            size = struct.unpack(">Q", head[8:16])[0]
            header = 16
        elif size == 0:
            size = total - pos
        if size < header:
            return None
        if kind == b"moov":
            if size > MAX_MOOV_BYTES:
                return None
            handle.seek(pos + header)
            return handle.read(size - header)
        pos += size
    return None


def _parse_text_date(text: str) -> datetime | None:
    """Fecha ISO 8601 de los metadatos. Sin zona horaria se toma como UTC."""
    text = text.strip().rstrip("\x00").strip()
    if not text:
        return None
    # 2026-11-14T09:12:33+0100 → +01:00, que es lo que entiende fromisoformat en todos los casos.
    if len(text) > 5 and text[-5] in "+-" and text[-4:].isdigit():
        text = f"{text[:-2]}:{text[-2:]}"
    try:
        moment = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=UTC)


def _meta_children_start(data: bytes, start: int, end: int) -> int:
    """meta es una caja completa (4 bytes de versión) en MP4, pero no en QuickTime."""
    if start + 8 <= end and data[start + 4:start + 8] in (b"hdlr", b"keys", b"ilst"):
        return start
    return start + 4


def _quicktime_creationdate(data: bytes, start: int, end: int) -> datetime | None:
    children = _meta_children_start(data, start, end)
    keys: list[bytes] = []
    items: dict[int, tuple[int, int]] = {}
    for kind, s, e in _boxes(data, children, end):
        if kind == b"keys" and s + 8 <= e:
            count = struct.unpack(">I", data[s + 4:s + 8])[0]
            pos = s + 8
            for _ in range(count):
                if pos + 8 > e:
                    break
                size = struct.unpack(">I", data[pos:pos + 4])[0]
                if size < 8 or pos + size > e:
                    break
                keys.append(data[pos + 8:pos + size])
                pos += size
        elif kind == b"ilst":
            for item, is_, ie in _boxes(data, s, e):
                items[struct.unpack(">I", item)[0]] = (is_, ie)
    for index, key in enumerate(keys, start=1):
        if key != b"com.apple.quicktime.creationdate" or index not in items:
            continue
        for kind, s, e in _boxes(data, *items[index]):
            # data: tipo (4) y configuración regional (4), luego el texto.
            if kind == b"data" and s + 8 <= e:
                return _parse_text_date(data[s + 8:e].decode("utf-8", "replace"))
    return None


def _udta_day(data: bytes, start: int, end: int) -> datetime | None:
    for kind, s, e in _boxes(data, start, end):
        if kind != b"\xa9day":
            continue
        # QuickTime: longitud (2) e idioma (2) delante del texto. MP4 de iTunes: caja data dentro.
        inner = list(_boxes(data, s, e))
        if inner and inner[0][0] == b"data":
            _, ds, de = inner[0]
            return _parse_text_date(data[ds + 8:de].decode("utf-8", "replace"))
        if s + 4 <= e:
            length = struct.unpack(">H", data[s:s + 2])[0]
            return _parse_text_date(data[s + 4:s + 4 + length].decode("utf-8", "replace"))
    return None


def _mvhd_creation(data: bytes, start: int, end: int) -> datetime | None:
    if start + 4 > end:
        return None
    version = data[start]
    if version == 1 and start + 12 <= end:
        seconds = struct.unpack(">Q", data[start + 4:start + 12])[0]
    elif start + 8 <= end:
        seconds = struct.unpack(">I", data[start + 4:start + 8])[0]
    else:
        return None
    if seconds == 0:
        return None
    try:
        return MAC_EPOCH + timedelta(seconds=seconds)
    except OverflowError:
        return None


def _plausible(moment: datetime | None, now: datetime) -> datetime | None:
    if moment is None or moment < EARLIEST or moment > now + FUTURE_MARGIN:
        return None
    return moment


def recording_time(path: str | Path, now: datetime | None = None) -> dict:
    """``{"fecha": ISO en UTC o None, "fuente": "metadatos" o None}``. Nunca lanza excepciones."""
    now = now or datetime.now(UTC)
    unknown = {"fecha": None, "fuente": None}
    try:
        with open(path, "rb") as handle:
            moov = _read_moov(handle)
    except OSError:
        return unknown
    if not moov:
        return unknown

    candidates: list[datetime | None] = [None, None, None]
    for kind, s, e in _boxes(moov):
        if kind == b"meta":
            candidates[0] = candidates[0] or _quicktime_creationdate(moov, s, e)
        elif kind == b"udta":
            candidates[1] = candidates[1] or _udta_day(moov, s, e)
            for inner, is_, ie in _boxes(moov, s, e):
                if inner == b"meta":
                    candidates[0] = candidates[0] or _quicktime_creationdate(moov, is_, ie)
        elif kind == b"mvhd":
            candidates[2] = _mvhd_creation(moov, s, e)

    for candidate in candidates:
        moment = _plausible(candidate, now)
        if moment:
            utc = moment.astimezone(UTC).replace(microsecond=0)
            return {"fecha": utc.strftime("%Y-%m-%dT%H:%M:%SZ"), "fuente": "metadatos"}
    return unknown
