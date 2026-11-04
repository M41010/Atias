"""Pruebas de tracker, clasificación y tubería. El vídeo es sintético: comprueban el software,
no la precisión en un invernadero real."""

from collections import Counter

import cv2
import numpy as np
import pytest

from atias.domain import UNASSIGNED_PLANT, CropProfile, FruitClass
from atias.simulation import CROPS, MARKER_MM, render_video, simulate_row, simulated_profiles
from atias.vision.detector import ColorBaselineDetector, Detection
from atias.vision.maturity import (
    UNCLASSIFIED,
    classify_caliber,
    classify_color,
    track_caliber_mm,
    vote_color,
)
from atias.vision.pipeline import MarkerSighting as Sighting
from atias.vision.pipeline import VideoError, VideoSpec, _nearest_plant, analyze_video
from atias.vision.tracker import CenterTracker

PROFILES = simulated_profiles(np.random.default_rng(0))


def box(cx, cy, half=8):
    return Detection(cx - half, cy - half, cx + half, cy + half)


class TestTracker:
    def test_same_fruit_panning_is_counted_once(self):
        tracker = CenterTracker()
        for frame in range(20):
            tracker.update(frame, [box(400 - 8 * frame, 100)])
        assert len(tracker.finish()) == 1

    def test_fruit_hidden_briefly_by_a_leaf_is_not_counted_twice(self):
        tracker = CenterTracker(max_age=10)
        other = 600
        for frame in range(30):
            # Un segundo fruto mantiene estimado el movimiento global mientras el primero se tapa.
            detections = [box(other - 8 * frame, 200)]
            if not 10 <= frame < 16:
                detections.append(box(400 - 8 * frame, 100))
            tracker.update(frame, detections)
        assert len(tracker.finish()) == 2

    def test_nearby_fruits_stay_separate(self):
        tracker = CenterTracker()
        for frame in range(15):
            tracker.update(frame, [box(300 - 8 * frame, 100), box(300 - 8 * frame, 125)])
        assert len(tracker.finish()) == 2

    def test_flickering_false_positive_is_discarded(self):
        tracker = CenterTracker(min_hits=4, max_age=0)
        tracker.update(0, [box(100, 100)])
        tracker.update(1, [])
        tracker.update(2, [])
        assert tracker.finish() == []


def color_frame(hsv):
    pixel = np.uint8([[hsv]])
    bgr = cv2.cvtColor(pixel, cv2.COLOR_HSV2BGR)[0, 0]
    frame = np.zeros((60, 60, 3), np.uint8)
    frame[:] = bgr
    return frame


class TestMaturity:
    @pytest.mark.parametrize(("hsv", "expected"), [
        ((2, 225, 205), "rojo"), ((175, 225, 205), "rojo"),  # El rojo cruza el 0 de HSV.
        ((16, 210, 215), "pinton"), ((55, 190, 175), "verde"),
    ])
    def test_color_classes(self, hsv, expected):
        frame = color_frame(hsv)
        assert classify_color(frame, Detection(10, 10, 50, 50),
                              PROFILES["tomate_cherry"]) == expected

    def test_dark_pixels_are_not_classified(self):
        frame = np.zeros((60, 60, 3), np.uint8)
        assert classify_color(frame, Detection(10, 10, 50, 50),
                              PROFILES["tomate_cherry"]) == UNCLASSIFIED

    def test_caliber_boundaries(self):
        classes = PROFILES["pepino"].classes
        assert classify_caliber(249, 50, classes) == "pequeno"
        assert classify_caliber(250, 50, classes) == "comercial"
        assert classify_caliber(340, 50, classes) == "grande"

    def test_caliber_without_scale_is_never_guessed(self):
        assert classify_caliber(None, None, PROFILES["pepino"].classes) == UNCLASSIFIED

    def test_caliber_can_require_diameter(self):
        classes = (FruitClass("ok", "Ok", True, length_mm=(0, 500), diameter_mm=(40, 60)),)
        assert classify_caliber(300, 50, classes) == "ok"
        assert classify_caliber(300, 70, classes) == UNCLASSIFIED
        assert classify_caliber(300, None, classes) == UNCLASSIFIED

    def test_undefined_caliber_thresholds_never_match(self):
        classes = (FruitClass("comercial", "Comercial", True),)
        assert classify_caliber(300, 50, classes) == UNCLASSIFIED

    def test_undefined_hue_thresholds_never_match(self):
        profile = CropProfile("x", "X", "color", (FruitClass("rojo", "Rojo", True),))
        frame = color_frame((2, 225, 205))
        assert classify_color(frame, Detection(10, 10, 50, 50), profile) == UNCLASSIFIED

    def test_track_length_resists_occlusion(self):
        length, _ = track_caliber_mm([300] * 9 + [120], [50] * 10)
        assert length == pytest.approx(300)

    def test_vote_ignores_unclassified(self):
        assert vote_color([UNCLASSIFIED, "rojo", UNCLASSIFIED, UNCLASSIFIED]) == "rojo"
        assert vote_color([UNCLASSIFIED]) == UNCLASSIFIED


class TestPlantAssignment:
    SIGHTINGS = [Sighting("1", 100, 44), Sighting("2", 340, 44)]

    def test_nearest_marker_wins(self):
        assert _nearest_plant(150, self.SIGHTINGS) == "1"
        assert _nearest_plant(300, self.SIGHTINGS) == "2"

    def test_far_from_every_marker_stays_unassigned(self):
        assert _nearest_plant(600, self.SIGHTINGS) is None

    def test_no_markers_means_no_assignment(self):
        assert _nearest_plant(100, []) is None


def spec_for(path, crop, plants=4):
    return VideoSpec(path, "SIM", crop, "1", "A", tuple(str(i + 1) for i in range(plants)),
                     MARKER_MM)


def visible_truth(fruits):
    return Counter(f.fruit_class for f in fruits if f.side_a)


@pytest.fixture(scope="module")
def tomato_video(tmp_path_factory):
    rng = np.random.default_rng(3)
    fruits = simulate_row("tomate_cherry", 4, rng)
    path = tmp_path_factory.mktemp("v") / "tomate.mp4"
    render_video(fruits, 4, "A", path, rng)
    return path, fruits


class TestPipeline:
    def test_counts_and_assigns_each_fruit_on_synthetic_video(self, tomato_video):
        path, fruits = tomato_video
        result = analyze_video(spec_for(path, "tomate_cherry"), PROFILES["tomate_cherry"],
                               ColorBaselineDetector())
        got = Counter()
        for per_class in result.counts.values():
            got.update(per_class)
        truth = visible_truth(fruits)
        for fruit_class, expected in truth.items():
            assert abs(got[fruit_class] - expected) <= max(2, 0.1 * expected)

        by_plant = Counter(f.plant for f in fruits if f.side_a)
        for plant, expected in by_plant.items():
            assert abs(sum(result.counts.get(plant, {}).values()) - expected) <= 2
        assert sum(result.counts.get(UNASSIGNED_PLANT, {}).values()) <= 2
        assert result.warnings == []

    def test_cucumber_caliber_uses_marker_scale(self, tmp_path):
        rng = np.random.default_rng(5)
        fruits = simulate_row("pepino", 4, rng)
        path = tmp_path / "pepino.mp4"
        render_video(fruits, 4, "A", path, rng)
        result = analyze_video(spec_for(path, "pepino"), PROFILES["pepino"],
                               ColorBaselineDetector())
        got = Counter()
        for per_class in result.counts.values():
            got.update(per_class)
        truth = visible_truth(fruits)
        for fruit_class in PROFILES["pepino"].mature_ids:
            assert abs(got[fruit_class] - truth[fruit_class]) <= 2

    def test_dark_video_is_flagged(self, tmp_path):
        rng = np.random.default_rng(6)
        fruits = simulate_row("pimiento", 3, rng)
        path = tmp_path / "oscuro.mp4"
        render_video(fruits, 3, "A", path, rng, brightness=0.3)
        result = analyze_video(spec_for(path, "pimiento", 3), PROFILES["pimiento"],
                               ColorBaselineDetector())
        assert "POCA_LUZ" in [w.code for w in result.warnings]

    def test_plant_outside_video_is_flagged(self, tomato_video):
        path, _ = tomato_video
        spec = spec_for(path, "tomate_cherry", 6)  # Se esperan 6 y el vídeo solo tiene 4.
        result = analyze_video(spec, PROFILES["tomate_cherry"], ColorBaselineDetector())
        warning = next(w for w in result.warnings if w.code == "PLANTAS_NO_VISTAS")
        assert "5, 6" in warning.message

    def test_unreadable_video_raises(self, tmp_path):
        bad = tmp_path / "no.mp4"
        bad.write_bytes(b"esto no es un video")
        with pytest.raises(VideoError):
            analyze_video(spec_for(bad, "pimiento"), PROFILES["pimiento"],
                          ColorBaselineDetector())


def test_simulated_crops_match_expected_list():
    assert set(CROPS) == {"tomate_cherry", "pimiento", "pepino"}
    assert isinstance(PROFILES["pepino"], CropProfile)
    assert PROFILES["pepino"].criterion == "calibre"
    assert all(p.uses_simulated_parameters() for p in PROFILES.values())
