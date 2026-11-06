"""Generador de datos SIMULADOS para ejercitar la tubería completa sin hardware ni datos reales.

Todo lo que produce este módulo es inventado: pesos, umbrales, colores y cosechas. Sirve para
comprobar que el software funciona de principio a fin, nunca para medir precisión real. Un
vídeo sintético es mucho más fácil que un invernadero: frutos planos, color limpio y sin
racimos apretados.
"""

from __future__ import annotations

import csv
import json
import sqlite3
from collections import defaultdict
from dataclasses import dataclass, replace
from datetime import date, datetime, timedelta
from pathlib import Path

import cv2
import numpy as np

from .domain import (
    Calibration,
    CropProfile,
    FruitClass,
    HarvestScope,
    Origin,
    WeightParam,
)
from .estimation import combine_plant_counts, fit_calibration
from .session import analyze_session, load_manifest
from .store import save_harvest
from .vision.detector import ColorBaselineDetector
from .vision.pipeline import ARUCO_DICTIONARY

SIM_MARKER = "LEEME_DATOS_SIMULADOS.txt"
FRAME_W, FRAME_H = 640, 360
PLANT_SPACING_PX = 240
MARGIN_PX = 280
MARKER_PX = 44
MARKER_MM = 100.0
PX_PER_MM = MARKER_PX / MARKER_MM
PAN_PX_PER_FRAME = 8
FPS = 15
SIMULATED_SIDE_OVERLAP = 0.5


@dataclass(frozen=True)
class ClassSim:
    fruit_class: FruitClass
    hsv: tuple[int, int, int]
    share: float
    weight_mean_g: float
    weight_sd_g: float


HUE_RED = ((0, 10), (170, 179))
HUE_ORANGE = ((11, 22),)
HUE_YELLOW = ((23, 35),)
HUE_GREEN = ((36, 85),)

CROPS: dict[str, dict] = {
    "tomate_cherry": {
        "label": "Tomate cherry", "criterion": "color", "fruits": (24, 36),
        "diameter_mm": (27, 34),
        "classes": [
            ClassSim(FruitClass("rojo", "Rojo", True, HUE_RED), (2, 225, 205), 0.5, 15, 3),
            ClassSim(FruitClass("pinton", "Pintón", False, HUE_ORANGE), (16, 210, 215), 0.2, 14, 3),
            ClassSim(FruitClass("verde", "Verde", False, HUE_GREEN), (55, 190, 175), 0.3, 12, 3),
        ],
    },
    "pimiento": {
        "label": "Pimiento", "criterion": "color", "fruits": (7, 12),
        "diameter_mm": (70, 90),
        "classes": [
            ClassSim(FruitClass("rojo", "Rojo", True, HUE_RED), (2, 220, 195), 0.35, 190, 30),
            ClassSim(FruitClass("amarillo", "Amarillo", True, HUE_YELLOW), (28, 220, 225), 0.2,
                     175, 28),
            ClassSim(FruitClass("verde", "Verde", False, HUE_GREEN), (55, 190, 165), 0.45, 150, 30),
        ],
    },
    "pepino": {
        "label": "Pepino", "criterion": "calibre", "fruits": (5, 8),
        "classes": [
            ClassSim(FruitClass("pequeno", "Pequeño", False, length_mm=(0, 250)),
                     (55, 190, 170), 0.35, 180, 30),
            ClassSim(FruitClass("comercial", "Comercial", True, length_mm=(250, 330)),
                     (55, 190, 170), 0.45, 320, 40),
            ClassSim(FruitClass("grande", "Grande", True, length_mm=(330, 1000)),
                     (55, 190, 170), 0.2, 430, 50),
        ],
        "length_ranges": {"pequeno": (170, 235), "comercial": (265, 315), "grande": (345, 400)},
    },
}

GREENHOUSES = {"INV-SIM-01": "tomate_cherry", "INV-SIM-02": "pimiento", "INV-SIM-03": "pepino"}


def simulated_profiles(rng: np.random.Generator) -> dict[str, CropProfile]:
    """Perfiles con pesos de una pesada de muestra simulada y sin calibración todavía."""
    profiles = {}
    for crop, spec in CROPS.items():
        weights = {}
        for sim in spec["classes"]:
            sample = rng.normal(sim.weight_mean_g, sim.weight_sd_g, 40)
            weights[sim.fruit_class.id] = WeightParam(
                round(float(sample.mean()), 1), round(float(sample.std(ddof=1)), 1), 40,
                Origin.SIMULATED)
        profiles[crop] = CropProfile(
            crop=crop, label=spec["label"], criterion=spec["criterion"],
            classes=tuple(s.fruit_class for s in spec["classes"]), weights=weights,
            side_overlap=SIMULATED_SIDE_OVERLAP, overlap_origin=Origin.SIMULATED,
        )
    return profiles


@dataclass
class SimFruit:
    plant: str
    fruit_class: str
    x: int
    y: int
    half_w: int
    half_h: int
    weight_g: float
    bgr: tuple[int, int, int]
    side_a: bool
    side_b: bool


def _hsv_to_bgr(hsv: tuple[int, int, int]) -> tuple[int, int, int]:
    pixel = np.uint8([[hsv]])
    return tuple(int(v) for v in cv2.cvtColor(pixel, cv2.COLOR_HSV2BGR)[0, 0])


def simulate_row(crop: str, n_plants: int, rng: np.random.Generator) -> list[SimFruit]:
    """Coloca frutos sin solaparse. Una parte queda oculta desde ambos lados."""
    spec = CROPS[crop]
    classes: list[ClassSim] = spec["classes"]
    shares = np.array([c.share for c in classes])
    fruits: list[SimFruit] = []
    for plant_index in range(n_plants):
        center = MARGIN_PX + PLANT_SPACING_PX * plant_index + PLANT_SPACING_PX // 2
        boxes: list[tuple[int, int, int, int]] = []
        for _ in range(int(rng.integers(*spec["fruits"]))):
            sim = classes[int(rng.choice(len(classes), p=shares / shares.sum()))]
            if crop == "pepino":
                length = rng.uniform(*spec["length_ranges"][sim.fruit_class.id])
                half_h = int(length * PX_PER_MM / 2)
                half_w = int(rng.uniform(45, 55) * PX_PER_MM / 2)
            else:
                half_w = half_h = int(rng.uniform(*spec["diameter_mm"]) * PX_PER_MM / 2)
            for _ in range(40):
                x = int(rng.integers(center - PLANT_SPACING_PX // 2 + 16 + half_w,
                                     center + PLANT_SPACING_PX // 2 - 16 - half_w))
                y = int(rng.integers(12 + half_h, 268 - half_h))
                box = (x - half_w - 5, y - half_h - 5, x + half_w + 5, y + half_h + 5)
                if all(box[2] < b[0] or box[0] > b[2] or box[3] < b[1] or box[1] > b[3]
                       for b in boxes):
                    boxes.append(box)
                    visibility = rng.random()
                    fruits.append(SimFruit(
                        plant=str(plant_index + 1), fruit_class=sim.fruit_class.id,
                        x=x, y=y, half_w=half_w, half_h=half_h,
                        weight_g=max(1.0, float(rng.normal(sim.weight_mean_g, sim.weight_sd_g))),
                        bgr=_hsv_to_bgr(sim.hsv),
                        side_a=0.12 <= visibility < 0.62,  # Reparto: 33 % solo A, 38 % solo B,
                        side_b=visibility >= 0.45,  # 17 % ambos, 12 % ninguno.
                    ))
                    break
    return fruits


def _foliage(height: int, width: int, rng: np.random.Generator) -> np.ndarray:
    coarse = rng.random((height // 12 + 2, width // 12 + 2, 1)).astype(np.float32)
    field = cv2.resize(coarse, (width, height), interpolation=cv2.INTER_CUBIC)
    value = np.clip(40 + field * 45, 25, 88).astype(np.uint8)
    hsv = np.dstack([np.full_like(value, 58), np.full_like(value, 85), value])
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)


def _draw_marker(panorama: np.ndarray, marker_id: int, center_x: int) -> None:
    dictionary = cv2.aruco.getPredefinedDictionary(ARUCO_DICTIONARY)
    marker = cv2.aruco.generateImageMarker(dictionary, marker_id, MARKER_PX)
    quiet = 6
    x0, y0 = center_x - MARKER_PX // 2, 290
    panorama[y0 - quiet:y0 + MARKER_PX + quiet, x0 - quiet:x0 + MARKER_PX + quiet] = 255
    panorama[y0:y0 + MARKER_PX, x0:x0 + MARKER_PX] = marker[..., None]


def render_video(fruits: list[SimFruit], n_plants: int, side: str, path: Path,
                 rng: np.random.Generator, *, brightness: float = 1.0) -> None:
    """Dibuja una pasada: paneo lateral con hojas en primer plano y ruido de cámara."""
    width = MARGIN_PX * 2 + PLANT_SPACING_PX * n_plants
    panorama = _foliage(FRAME_H, width, rng)
    for fruit in fruits:
        if not (fruit.side_a if side == "A" else fruit.side_b):
            continue
        x = fruit.x if side == "A" else width - 1 - fruit.x
        cv2.ellipse(panorama, (x, fruit.y), (fruit.half_w, fruit.half_h), 0, 0, 360, fruit.bgr, -1,
                    cv2.LINE_AA)
    for plant_index in range(n_plants):
        center = MARGIN_PX + PLANT_SPACING_PX * plant_index + PLANT_SPACING_PX // 2
        x = center if side == "A" else width - 1 - center
        _draw_marker(panorama, plant_index + 1, x)

    # Hojas en primer plano que se mueven con paralaje y tapan frutos un instante.
    parallax = 1.25
    layer_width = int(width * parallax) + FRAME_W
    leaves = _foliage(FRAME_H, layer_width, rng)
    leaf_mask = np.zeros((FRAME_H, layer_width), np.uint8)
    for _ in range(layer_width // 110):
        center = (int(rng.integers(0, layer_width)), int(rng.integers(0, 270)))
        axes = (int(rng.integers(10, 22)), int(rng.integers(6, 14)))
        cv2.ellipse(leaf_mask, center, axes, float(rng.uniform(0, 180)), 0, 360, 255, -1)

    # Ruido precalculado: generar uno por fotograma haría la demostración muy lenta.
    noise_bank = [rng.normal(0, 3, (FRAME_H, FRAME_W, 3)).astype(np.float32) for _ in range(6)]
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (FRAME_W, FRAME_H))
    if not writer.isOpened():
        raise RuntimeError(f"No se pudo crear el vídeo {path}")
    try:
        for offset in range(0, width - FRAME_W + 1, PAN_PX_PER_FRAME):
            frame = panorama[:, offset:offset + FRAME_W].copy()
            leaf_offset = int(offset * parallax)
            mask = leaf_mask[:, leaf_offset:leaf_offset + FRAME_W] > 0
            frame[mask] = leaves[:, leaf_offset:leaf_offset + FRAME_W][mask]
            noise = noise_bank[int(rng.integers(len(noise_bank)))]
            shaken = np.roll(frame, int(rng.integers(-2, 3)), axis=0)
            writer.write(np.clip((shaken + noise) * brightness, 0, 255).astype(np.uint8))
    finally:
        writer.release()


def make_records_csv(path: Path, rng: np.random.Generator, end: date) -> None:
    """Registro histórico SIMULADO con los defectos típicos que debe detectar la revisión."""
    rows = []
    for days_ago in range(0, 84, 7):
        for monday_offset in range(4):
            day = end - timedelta(days=days_ago + monday_offset)
            for greenhouse, crop in GREENHOUSES.items():
                kg = float(rng.normal({"tomate_cherry": 60, "pimiento": 90, "pepino": 110}[crop],
                                      15))
                date_text = day.strftime("%d/%m/%Y" if days_ago % 2 == 0 else "%Y-%m-%d")
                crop_text = CROPS[crop]["label"]
                rows.append([date_text, greenhouse, crop_text, f"{kg:.1f}".replace(".", ","),
                             "SIMULADO"])
    rows[3][3] = ""
    rows[9][3] = "-12,5"
    rows[15][2] = "tomate  CHERRY "
    rows[21][3] = "9000,0"
    rows.append(list(rows[0]))
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file, delimiter=";")
        writer.writerow(["Fecha", "Invernadero", "Cultivo", "Kilos netos", "ORIGEN_DATO"])
        writer.writerows(rows)


def _plant_counts_by_row(conn: sqlite3.Connection, session_id: int
                         ) -> dict[tuple[str, str], dict[str, dict[str, int]]]:
    per_plant: dict = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for r in conn.execute("SELECT * FROM plant_counts WHERE session_id=?", (session_id,)):
        per_plant[(r["row"], r["plant"])][r["side"]][r["fruit_class"]] += r["n"]
    return per_plant


def run_demo(out_dir: Path, conn: sqlite3.Connection, *, n_weeks: int = 4,
             calibration_weeks: int = 2, n_rows: int = 2, n_plants: int = 5, seed: int = 7,
             end: date | None = None,
             inject_faults: bool = True, progress=None) -> dict[str, CropProfile]:
    """Genera todo el escenario simulado y lo carga en la base de datos.

    Las primeras ``calibration_weeks`` semanas sirven para ajustar ``k`` y quedan marcadas como
    dentro de muestra. La evaluación usa solo las siguientes.
    """
    if not 0 < calibration_weeks < n_weeks:
        raise ValueError("calibration_weeks debe estar entre 1 y n_weeks - 1")
    rng = np.random.default_rng(seed)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / SIM_MARKER).write_text(
        "TODO EL CONTENIDO DE ESTA CARPETA ES SIMULADO.\n"
        "No procede de ningún invernadero y no sirve para medir precisión real.\n",
        encoding="utf-8",
    )
    end = end or date.today()
    last_saturday = end - timedelta(days=(end.weekday() - 5) % 7)
    captures = [last_saturday - timedelta(weeks=n_weeks - 1 - i) for i in range(n_weeks)]
    make_records_csv(out_dir / "registros_cosecha_SIMULADO.csv", rng, last_saturday)

    profiles = simulated_profiles(rng)
    detector = ColorBaselineDetector()
    calibration_data: dict[str, tuple[list[float], list[float]]] = defaultdict(lambda: ([], []))
    harvest_rows = []

    for week_index, capture_day in enumerate(captures):
        if week_index == calibration_weeks:
            for crop, (counted, true) in calibration_data.items():
                factor, sd = fit_calibration(counted, true, seed=seed)
                profiles[crop] = replace(profiles[crop], calibration=Calibration(
                    round(factor, 3), round(sd, 3), len(counted), Origin.SIMULATED))

        is_last = week_index == n_weeks - 1
        for gh_index, (greenhouse, crop) in enumerate(GREENHOUSES.items()):
            if progress:
                progress(f"{capture_day} · {greenhouse}")
            folder = out_dir / capture_day.isoformat() / greenhouse
            folder.mkdir(parents=True, exist_ok=True)
            truth: dict[tuple[str, str], list[SimFruit]] = defaultdict(list)
            videos = []
            for row_index in range(n_rows):
                row = str(row_index + 1)
                fruits = simulate_row(crop, n_plants, rng)
                for fruit in fruits:
                    truth[(row, fruit.plant)].append(fruit)
                for side in "AB":
                    # Fallos inyectados en la última semana para ver las advertencias en la app.
                    if inject_faults and is_last and gh_index == 1 and row_index == 1 \
                            and side == "B":
                        continue
                    dim = inject_faults and is_last and gh_index == 2 and row_index == 0 \
                        and side == "A"
                    name = f"hilera{row}_lado{side}.mp4"
                    render_video(fruits, n_plants, side, folder / name, rng,
                                 brightness=0.3 if dim else 1.0)
                    videos.append({
                        "archivo": name, "cultivo": crop, "hilera": row, "lado": side,
                        "plantas": [str(i + 1) for i in range(n_plants)],
                        "tamano_marcador_mm": MARKER_MM,
                    })
            captured_at = datetime.combine(capture_day, datetime.min.time()).replace(hour=8)
            manifest_path = folder / "manifiesto.json"
            manifest_path.write_text(json.dumps({
                "invernadero": greenhouse,
                "fecha_captura": captured_at.isoformat(),
                "metodo": "sintetico",
                "origen": Origin.SIMULATED.value,
                "fuera_de_muestra": week_index >= calibration_weeks,
                "videos": videos,
            }, indent=2, ensure_ascii=False), encoding="utf-8")
            manifest = load_manifest(manifest_path)
            session_id = analyze_session(manifest, profiles, detector, conn)

            profile = profiles[crop]
            if week_index < calibration_weeks:
                per_plant = _plant_counts_by_row(conn, session_id)
                for (row, plant), fruit_list in truth.items():
                    combined = combine_plant_counts(per_plant.get((row, plant), {}), profile)
                    counted = sum(v for c, v in combined.items() if c in profile.mature_ids)
                    actual = sum(1 for f in fruit_list if f.fruit_class in profile.mature_ids)
                    calibration_data[crop][0].append(counted)
                    calibration_data[crop][1].append(actual)

            all_fruits = [f for items in truth.values() for f in items]
            immediate = sum(f.weight_g for f in all_fruits
                            if f.fruit_class in profile.mature_ids) / 1000
            # Lunes a viernes incluye fruta que madura tras la captura: por eso no es comparable.
            ripening = sum(f.weight_g for f in all_fruits
                           if f.fruit_class not in profile.mature_ids and rng.random() < 0.35
                           ) / 1000
            week = manifest.week
            for scope, kg in ((HarvestScope.IMMEDIATE, immediate),
                              (HarvestScope.MON_FRI, immediate + ripening)):
                save_harvest(conn, greenhouse, crop, week, scope, round(kg, 2), Origin.SIMULATED)
                harvest_rows.append([greenhouse, crop, week, scope.value, round(kg, 2),
                                     Origin.SIMULATED.value])

    with (out_dir / "cosecha_real_SIMULADA.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["invernadero", "cultivo", "semana", "alcance", "kg", "origen"])
        writer.writerows(harvest_rows)
    return profiles
