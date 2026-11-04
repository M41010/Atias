import pytest

from atias.domain import Calibration, CropProfile, FruitClass, Origin, WeightParam
from atias.estimation import combine_plant_counts, combine_sides, estimate, fit_calibration


def profile(calibration=None, weights=None, overlap=None):
    return CropProfile(
        crop="pimiento", label="Pimiento", criterion="color",
        classes=(FruitClass("rojo", "Rojo", True), FruitClass("verde", "Verde", False)),
        weights={"rojo": WeightParam(200.0, 20.0, 100, Origin.MEASURED)}
        if weights is None else weights,
        calibration=calibration, side_overlap=overlap,
    )


@pytest.mark.parametrize(("a", "b", "overlap", "expected"), [
    (10, 6, 0.0, 16),   # Ningún fruto visto por ambos lados.
    (10, 6, 1.0, 10),   # Todos los del lado menor repetidos: max(A, B).
    (10, 6, 0.5, 13),
    (0, 6, 0.5, 6),
])
def test_combine_sides(a, b, overlap, expected):
    assert combine_sides(a, b, overlap) == expected


@pytest.mark.parametrize(("a", "b", "overlap"), [(1, 1, 1.5), (1, 1, -0.1), (-1, 1, 0.5)])
def test_combine_sides_rejects_invalid(a, b, overlap):
    with pytest.raises(ValueError):
        combine_sides(a, b, overlap)


def test_without_measured_overlap_assumes_max_to_avoid_double_count():
    counts = combine_plant_counts({"A": {"rojo": 10}, "B": {"rojo": 6}}, profile(overlap=None))
    assert counts == {"rojo": 10}


def test_kg_is_count_times_factor_times_weight_and_ignores_immature():
    cal = Calibration(1.5, 0.0, 10, Origin.MEASURED)
    result = estimate({"rojo": 10, "verde": 99}, profile(calibration=cal))
    assert result.kg == pytest.approx(10 * 1.5 * 200 / 1000)
    assert result.counted_mature == 10
    assert "verde" not in result.by_class
    assert result.kg_low < result.kg < result.kg_high


def test_uncalibrated_estimate_warns_instead_of_hiding_it():
    result = estimate({"rojo": 10}, profile())
    assert not result.calibrated
    assert [w.code for w in result.warnings] == ["SIN_CALIBRAR"]


def test_missing_weight_yields_no_kg_rather_than_an_invented_value():
    result = estimate({"rojo": 10}, profile(weights={}))
    assert result.kg is None and result.kg_low is None
    assert result.counted_mature == 10
    assert "SIN_PESO" in [w.code for w in result.warnings]


def test_no_mature_fruit_is_zero_kg_not_missing():
    result = estimate({"verde": 5}, profile())
    assert result.kg == 0


def test_systematic_error_does_not_shrink_when_aggregating():
    """El error de k afecta por igual a todas las plantas: agregar no lo reduce."""
    cal = Calibration(1.0, 0.1, 10, Origin.MEASURED)
    precise = {"rojo": WeightParam(200.0, 0.0, 100, Origin.MEASURED)}
    small = estimate({"rojo": 10}, profile(calibration=cal, weights=precise))
    large = estimate({"rojo": 10_000}, profile(calibration=cal, weights=precise))
    relative = lambda e: (e.kg_high - e.kg) / e.kg  # noqa: E731
    assert relative(large) == pytest.approx(relative(small))


def test_fruit_to_fruit_variation_does_shrink_when_aggregating():
    variable = {"rojo": WeightParam(200.0, 50.0, 10**9, Origin.MEASURED)}
    small = estimate({"rojo": 10}, profile(weights=variable))
    large = estimate({"rojo": 10_000}, profile(weights=variable))
    relative = lambda e: (e.kg_high - e.kg) / e.kg  # noqa: E731
    assert relative(large) < relative(small) / 10


def test_fit_calibration_recovers_ratio():
    factor, sd = fit_calibration([10, 20, 30, 40], [15, 30, 45, 60])
    assert factor == pytest.approx(1.5)
    assert sd == pytest.approx(0, abs=1e-9)


def test_fit_calibration_requires_counted_fruit():
    with pytest.raises(ValueError):
        fit_calibration([0, 0], [1, 2])
