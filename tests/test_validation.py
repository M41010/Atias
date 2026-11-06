import pytest

from atias.domain import HarvestScope, Origin, Semantics
from atias.validation import Pair, Verdict, evaluate


def pair(est=100.0, real=100.0, *, scope=HarvestScope.IMMEDIATE, origin=Origin.MEASURED,
         semantics=Semantics.OBSERVED, oos=True, week="2026-W45"):
    return Pair("I1", "pepino", week, est, real, semantics, scope, origin, oos)


def test_error_formula():
    assert pair(est=90, real=100).error_pct == pytest.approx(10)
    assert pair(est=110, real=100).error_pct == pytest.approx(10)
    assert pair(est=50, real=0).error_pct is None


def test_metrics_with_known_values():
    report = evaluate([pair(90, 100), pair(330, 300)], min_pairs=1)
    # WAPE = (10 + 30) / 400 = 10 %, MAPE = (10 + 10) / 2 = 10 %, sesgo = +20 / 400 = +5 %.
    assert report.wape_pct == pytest.approx(10)
    assert report.mape_pct == pytest.approx(10)
    assert report.bias_pct == pytest.approx(5)
    assert report.within_target_pct == pytest.approx(100)


def test_wape_is_not_dominated_by_tiny_harvests_unlike_mape():
    report = evaluate([pair(2, 1), pair(1000, 1000)], min_pairs=1)
    assert report.mape_pct == pytest.approx(50)
    assert report.wape_pct < 0.2


def test_perfect_simulated_data_never_validates_the_target():
    pairs = [pair(100, 100, origin=Origin.SIMULATED) for _ in range(50)]
    assert evaluate(pairs).verdict == Verdict.SIMULATED


def test_one_simulated_pair_taints_the_whole_evaluation():
    pairs = [pair() for _ in range(50)] + [pair(origin=Origin.SIMULATED)]
    assert evaluate(pairs).verdict == Verdict.SIMULATED


def test_observed_is_not_comparable_with_monday_thursday_harvest():
    pairs = [pair(scope=HarvestScope.MON_FRI) for _ in range(50)]
    assert evaluate(pairs).verdict == Verdict.NOT_COMPARABLE


def test_forecast_is_comparable_with_monday_thursday_harvest():
    pairs = [pair(scope=HarvestScope.MON_FRI, semantics=Semantics.FORECAST_MON_FRI)
             for _ in range(50)]
    assert evaluate(pairs).verdict == Verdict.MET


def test_too_few_pairs_is_inconclusive_even_if_perfect():
    assert evaluate([pair() for _ in range(3)], min_pairs=8).verdict == Verdict.INSUFFICIENT


def test_good_real_data_meets_target():
    pairs = [pair(100 + (i % 3), 100) for i in range(30)]
    report = evaluate(pairs)
    assert report.verdict == Verdict.MET
    assert report.wape_ci90_pct[1] <= 10


def test_bad_real_data_does_not_meet_target():
    assert evaluate([pair(130, 100) for _ in range(30)]).verdict == Verdict.NOT_MET


def test_interval_must_be_inside_target_not_just_the_mean():
    # WAPE medio por debajo de 10 % pero con semanas muy dispares.
    pairs = [pair(100, 100) for _ in range(6)] + [pair(140, 100) for _ in range(2)]
    report = evaluate(pairs)
    assert report.wape_pct < 10.1
    assert report.verdict == Verdict.NOT_MET


def test_in_sample_pairs_are_excluded():
    report = evaluate([pair(oos=False) for _ in range(50)])
    assert report.verdict == Verdict.NO_DATA
    assert report.n_excluded == 50


def test_zero_harvest_is_excluded_and_reported():
    report = evaluate([pair(10, 0)] + [pair() for _ in range(10)])
    assert report.n_pairs == 10
    assert report.n_excluded == 1


def test_no_pairs_at_all():
    assert evaluate([]).verdict == Verdict.NO_DATA
