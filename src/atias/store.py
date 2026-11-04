"""Persistencia local en SQLite: funciona sin conexión y sin servidor de base de datos.

Se guardan recuentos brutos por lado, junto con una copia de los parámetros usados. Los kg se
calculan al consultar, de modo que cada resultado es reproducible y se puede recalcular.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from .domain import CropProfile, HarvestScope, Origin, Warning

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    greenhouse TEXT NOT NULL,
    week TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    method TEXT NOT NULL,
    origin TEXT NOT NULL,
    detector TEXT NOT NULL,
    status TEXT NOT NULL,
    out_of_sample INTEGER NOT NULL,
    profiles_json TEXT NOT NULL,
    quality_json TEXT NOT NULL,
    UNIQUE (greenhouse, week, method)
);
CREATE TABLE IF NOT EXISTS plant_counts (
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    row TEXT NOT NULL,
    plant TEXT NOT NULL,
    side TEXT NOT NULL,
    fruit_class TEXT NOT NULL,
    n INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_counts_session ON plant_counts(session_id);
CREATE TABLE IF NOT EXISTS session_warnings (
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    scope TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS harvests (
    greenhouse TEXT NOT NULL,
    crop TEXT NOT NULL,
    week TEXT NOT NULL,
    scope TEXT NOT NULL,
    kg REAL NOT NULL,
    origin TEXT NOT NULL,
    PRIMARY KEY (greenhouse, crop, week, scope)
);
"""


def connect(path: str | Path) -> sqlite3.Connection:
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    return conn


@dataclass(frozen=True)
class CountRow:
    crop: str
    row: str
    plant: str
    side: str
    fruit_class: str
    n: int


def save_session(
    conn: sqlite3.Connection,
    *,
    greenhouse: str,
    week: str,
    captured_at: str,
    method: str,
    origin: Origin,
    detector: str,
    status: str,
    out_of_sample: bool,
    profiles: dict[str, CropProfile],
    quality: list[dict],
    counts: list[CountRow],
    warnings: list[Warning],
) -> int:
    """Guarda una sesión. Repetir el análisis sustituye el resultado anterior."""
    with conn:
        conn.execute("DELETE FROM sessions WHERE greenhouse=? AND week=? AND method=?",
                     (greenhouse, week, method))
        cursor = conn.execute(
            "INSERT INTO sessions (greenhouse, week, captured_at, method, origin, detector, "
            "status, out_of_sample, profiles_json, quality_json) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (greenhouse, week, captured_at, method, origin.value, detector, status,
             int(out_of_sample),
             json.dumps({k: p.to_dict() for k, p in profiles.items()}, ensure_ascii=False),
             json.dumps(quality, ensure_ascii=False)),
        )
        session_id = cursor.lastrowid
        conn.executemany(
            "INSERT INTO plant_counts VALUES (?,?,?,?,?,?,?)",
            [(session_id, c.crop, c.row, c.plant, c.side, c.fruit_class, c.n) for c in counts],
        )
        conn.executemany(
            "INSERT INTO session_warnings VALUES (?,?,?,?,?)",
            [(session_id, w.code, w.severity.value, w.message, w.scope) for w in warnings],
        )
    return session_id


def save_harvest(conn: sqlite3.Connection, greenhouse: str, crop: str, week: str,
                 scope: HarvestScope, kg: float, origin: Origin) -> None:
    if kg < 0:
        raise ValueError("La cosecha real no puede ser negativa")
    with conn:
        conn.execute("INSERT OR REPLACE INTO harvests VALUES (?,?,?,?,?,?)",
                     (greenhouse, crop, week, scope.value, kg, origin.value))
