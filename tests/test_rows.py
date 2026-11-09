"""Conteo por tramos sin marcadores y detector ONNX con teselas.

Los vídeos son sintéticos: comprueban el software (posición, tramos, seguimiento), no la precisión
en un invernadero real."""

from pathlib import Path
from types import SimpleNamespace

import cv2
import numpy as np
import pytest

from atias.domain import CropProfile, FruitClass
from atias.vision.detector import ColorBaselineDetector
from atias.vision.onnx_detector import (
    ModelConfig,
    OnnxDetector,
    merge_duplicates,
    postprocess,
    tile_boxes,
)
from atias.vision.rows import RowVideoError, analyze_row_video, tramo_of

PROFILE = CropProfile(
    crop="tomate_cherry",
    label="Tomate cherry",
    criterion="color",
    classes=(
        FruitClass("rojo", "Rojo", True, ((0, 10), (170, 179))),
        FruitClass("inmaduro", "Inmaduro", False, ((35, 85),)),
    ),
)

FRAME_W, FRAME_H = 480, 270
WORLD_W = 4000
RED = (0, 0, 220)
GREEN = (40, 200, 40)


def world_image(fruits: list[tuple[int, int, tuple[int, int, int]]], seed: int = 1) -> np.ndarray:
    """Fondo gris con textura (para medir el desplazamiento) y frutos en posiciones conocidas."""
    rng = np.random.default_rng(seed)
    noise = rng.integers(60, 140, (FRAME_H // 6, WORLD_W // 6), dtype=np.uint8)
    gray = cv2.resize(noise, (WORLD_W, FRAME_H), interpolation=cv2.INTER_LINEAR)
    world = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    for x, y, color in fruits:
        cv2.circle(world, (x, y), 14, color, -1)
    return world


def write_video(path: Path, world: np.ndarray, speeds: list[int], fps: int = 30) -> None:
    """Recorre el mundo de izquierda a derecha; cada elemento de ``speeds`` es un fotograma."""
    writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*"MJPG"), fps, (FRAME_W, FRAME_H))
    offset = 0
    for speed in speeds:
        writer.write(np.ascontiguousarray(world[:, offset : offset + FRAME_W]))
        offset = min(WORLD_W - FRAME_W, offset + speed)
    writer.release()


def expected_tramo(x: int, tramos: int) -> int:
    # Un fruto se ve hacia la mitad cuando la cámara está centrada en él.
    return tramo_of(x - FRAME_W / 2, WORLD_W - FRAME_W, tramos)


class TestTramos:
    def test_posicion_dentro_del_recorrido(self):
        assert tramo_of(0, 100, 4) == 0
        assert tramo_of(49, 100, 4) == 1
        assert tramo_of(100, 100, 4) == 3
        assert tramo_of(5, 0, 4) == 0

    def test_cada_fruto_cae_en_su_tramo_y_por_clase(self, tmp_path):
        fruits = [
            (400, 90, RED),
            (900, 180, RED),
            (1500, 120, GREEN),
            (2300, 90, RED),
            (2900, 200, RED),
            (3500, 130, GREEN),
        ]
        path = tmp_path / "hilera.avi"
        write_video(path, world_image(fruits), [12] * 320)
        result = analyze_row_video(
            path, PROFILE, ColorBaselineDetector(), tramos=4, analysis_fps=10
        )

        expected = [{} for _ in range(4)]
        for x, _, color in fruits:
            label = "rojo" if color == RED else "inmaduro"
            tramo = expected[expected_tramo(x, 4)]
            tramo[label] = tramo.get(label, 0) + 1
        assert result.tramos == expected
        assert result.position == "desplazamiento"
        assert result.mature(PROFILE) == [
            sum(v for k, v in t.items() if k == "rojo") for t in expected
        ]
        assert "DETECTOR_DE_PRUEBA" in result.warnings

    def test_parar_a_mitad_no_desplaza_los_tramos(self, tmp_path):
        """Con el tiempo, una parada larga movería los frutos de tramo; midiendo el
        desplazamiento, no."""
        fruits = [(700, 120, RED), (3300, 120, RED)]
        path = tmp_path / "parada.avi"
        # Avanza, se para mucho rato al principio y sigue.
        write_video(path, world_image(fruits), [12] * 40 + [0] * 200 + [12] * 280)
        result = analyze_row_video(
            path, PROFILE, ColorBaselineDetector(), tramos=4, analysis_fps=10
        )
        assert sum(sum(t.values()) for t in result.tramos) == 2
        assert result.tramos[expected_tramo(700, 4)] == {"rojo": 1}
        assert result.tramos[expected_tramo(3300, 4)] == {"rojo": 1}

    def test_sin_movimiento_usa_el_tiempo_y_avisa(self, tmp_path):
        path = tmp_path / "quieto.avi"
        write_video(path, world_image([(200, 120, RED)]), [0] * 60)
        result = analyze_row_video(
            path, PROFILE, ColorBaselineDetector(), tramos=3, analysis_fps=10
        )
        assert result.position == "tiempo"
        assert "POSICION_POR_TIEMPO" in result.warnings

    def test_un_video_ilegible_da_error(self, tmp_path):
        path = tmp_path / "roto.mp4"
        path.write_bytes(b"no es un video")
        with pytest.raises(RowVideoError):
            analyze_row_video(path, PROFILE, ColorBaselineDetector(), tramos=4)

    def test_el_resultado_se_puede_enviar_como_json(self, tmp_path):
        path = tmp_path / "hilera.avi"
        write_video(path, world_image([(1000, 120, RED)]), [12] * 320)
        data = analyze_row_video(
            path, PROFILE, ColorBaselineDetector(), tramos=2, analysis_fps=10
        ).to_dict(PROFILE)
        assert data["maduros"] == 1
        assert [t["n"] for t in data["tramos"]] == [1, 2]
        assert data["posicion"] == "desplazamiento"

    def test_guarda_la_posicion_de_cada_fruto_maduro(self, tmp_path):
        """Para comparar con el conteo a mano entre dos cintas: solo maduros, de 0 a 1."""
        fruits = [(700, 120, RED), (1500, 120, GREEN), (3300, 120, RED)]
        path = tmp_path / "hilera.avi"
        write_video(path, world_image(fruits), [12] * 320)
        data = analyze_row_video(
            path, PROFILE, ColorBaselineDetector(), tramos=4, analysis_fps=10
        ).to_dict(PROFILE)
        positions = data["posicionesMaduros"]
        assert len(positions) == data["maduros"] == 2
        assert positions == sorted(positions)
        assert all(0 <= p <= 1 for p in positions)
        expected = [(x - FRAME_W / 2) / (WORLD_W - FRAME_W) for x in (700, 3300)]
        assert positions == pytest.approx(expected, abs=0.05)


class FakeSession:
    """Imita la salida de RF-DETR exportado: dets en cxcywh normalizado y logits por
    clase más el fondo."""

    def __init__(self, per_tile):
        self.per_tile = per_tile
        self.calls = []

    def get_outputs(self):
        return [SimpleNamespace(name="dets"), SimpleNamespace(name="labels")]

    def run(self, names, inputs):
        assert names == ["dets", "labels"]
        tensor = inputs["input"]
        assert tensor.shape == (1, 3, 64, 64) and tensor.dtype == np.float32
        index = len(self.calls)
        self.calls.append(tensor)
        dets, logits = self.per_tile(index)
        return [np.array([dets], dtype=np.float32), np.array([logits], dtype=np.float32)]


CONFIG = ModelConfig(
    name="prueba",
    crop="tomate_cherry",
    resolution=64,
    classes=("verde", "maduro"),
    equivalences={"verde": "inmaduro", "maduro": "rojo"},
    threshold=0.5,
    tiles=(2, 1),
    overlap=0.2,
    max_width=1000,
)


class TestOnnxDetector:
    def test_teselas_cubren_el_fotograma_con_solape(self):
        boxes = tile_boxes(1000, 500, 2, 2, 0.2)
        assert len(boxes) == 4
        assert boxes[0][0] == 0 and boxes[0][1] == 0
        assert boxes[-1][2] == 1000 and boxes[-1][3] == 500
        assert boxes[1][0] < boxes[0][2]  # Se solapan.

    def test_postproceso_descarta_el_fondo_y_lo_poco_seguro(self):
        dets = np.array([[0.5, 0.5, 0.2, 0.2], [0.1, 0.1, 0.1, 0.1]])
        # Tres columnas: verde, maduro y fondo (ignorado aunque sea alto).
        logits = np.array([[-5.0, 4.0, 9.0], [-5.0, -5.0, 9.0]])
        boxes, scores, classes = postprocess(dets, logits, 2, 0.5)
        assert len(boxes) == 1 and classes[0] == 1 and scores[0] > 0.9
        np.testing.assert_allclose(boxes[0], [0.4, 0.4, 0.6, 0.6])

    def test_une_el_mismo_fruto_visto_en_dos_teselas(self):
        boxes = np.array(
            [[10, 10, 30, 30], [11, 10, 31, 30], [100, 100, 120, 120]], dtype=np.float32
        )
        assert sorted(merge_duplicates(boxes, np.array([0.9, 0.8, 0.7]))) == [0, 2]

    def test_detecta_en_coordenadas_del_fotograma_y_traduce_la_clase(self):
        # Fotograma de 2000 px: se reduce a 1000 (ancho máximo) y se parte en 2 teselas.
        def per_tile(index):
            if index == 0:
                return [[0.5, 0.5, 0.1, 0.1]], [[-5.0, 5.0, -5.0]]
            return [[0.5, 0.5, 0.1, 0.1]], [[5.0, -5.0, -5.0]]

        session = FakeSession(per_tile)
        detector = OnnxDetector(CONFIG, session)
        found = detector.detect(np.zeros((1000, 2000, 3), np.uint8))
        assert len(session.calls) == 2
        assert sorted(d.label for d in found) == ["inmaduro", "rojo"]
        left = next(d for d in found if d.label == "rojo")
        tile_w = tile_boxes(1000, 500, 2, 1, 0.2)[0][2]
        # Centro de la primera tesela, devuelto a la escala original (x2).
        assert abs(left.center[0] - tile_w) < 4
        assert abs(left.center[1] - 500) < 4

    def test_rechaza_un_modelo_sin_las_salidas_esperadas(self):
        session = SimpleNamespace(get_outputs=lambda: [SimpleNamespace(name="output0")])
        with pytest.raises(ValueError):
            OnnxDetector(CONFIG, session)

    def test_lee_la_configuracion_y_exige_equivalencias(self, tmp_path):
        path = tmp_path / "modelo.json"
        path.write_text(
            '{"nombre": "m", "cultivo": "pepino", "resolucion": 384, "clases": ["a", "b"],'
            ' "equivalencias": {"a": "comercial"}}',
            encoding="utf-8",
        )
        with pytest.raises(ValueError, match="b"):
            ModelConfig.load(path)


def test_modo_fruto_y_color_deja_la_madurez_al_color(tmp_path):
    """Con equivalencia null el detector solo localiza: la clase sale del color del fruto."""
    config = ModelConfig(
        name="fruto",
        crop="tomate_cherry",
        resolution=64,
        classes=("fruto",),
        equivalences={"fruto": None},
        tiles=(1, 1),
        max_width=1000,
    )
    session = FakeSession(lambda _: ([[0.5, 0.5, 0.2, 0.2]], [[6.0, -6.0]]))
    found = OnnxDetector(config, session).detect(np.zeros((100, 100, 3), np.uint8))
    assert len(found) == 1 and found[0].label is None

    path = tmp_path / "modelo.json"
    path.write_text(
        '{"nombre": "m", "cultivo": "tomate_cherry", "resolucion": 384, "clases": ["fruto"],'
        ' "equivalencias": {"fruto": null}}',
        encoding="utf-8",
    )
    assert ModelConfig.load(path).equivalences == {"fruto": None}
