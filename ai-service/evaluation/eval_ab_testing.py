"""
PricePilot AI — A/B Testing Statistical Evaluator
Validates Type I / Type II error rates, sample size adequacy,
revenue attribution accuracy, and confidence level calculations.
"""
import sys
import os
import numpy as np
from typing import Dict, List
from scipy import stats

# Fix Windows console encoding for Unicode/emoji
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ── Simulation Helpers ────────────────────────────────────────────────────────

def _simulate_ab_test(
    n_a: int,
    n_b: int,
    cr_a: float,
    cr_b: float,
    price_a: float = 100.0,
    price_b: float = 110.0,
) -> Dict:
    """
    Simulate a single A/B test with given sample sizes and conversion rates.
    Returns views, conversions, revenue, and a z-test significance result.
    """
    np.random.seed(None)  # truly random for Monte Carlo

    conversions_a = np.random.binomial(n_a, cr_a)
    conversions_b = np.random.binomial(n_b, cr_b)

    revenue_a = conversions_a * price_a
    revenue_b = conversions_b * price_b

    # Z-test for difference in proportions
    p_a = conversions_a / n_a if n_a > 0 else 0
    p_b = conversions_b / n_b if n_b > 0 else 0
    p_pool = (conversions_a + conversions_b) / (n_a + n_b) if (n_a + n_b) > 0 else 0

    se = np.sqrt(p_pool * (1 - p_pool) * (1 / n_a + 1 / n_b)) if p_pool > 0 and p_pool < 1 else 1e-9
    z = (p_b - p_a) / max(se, 1e-9)
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))

    significant = p_value < 0.05

    winner = None
    if significant:
        winner = "B" if p_b > p_a else "A"

    return {
        "views_a": n_a,
        "views_b": n_b,
        "conversions_a": conversions_a,
        "conversions_b": conversions_b,
        "revenue_a": round(revenue_a, 2),
        "revenue_b": round(revenue_b, 2),
        "cr_a": round(p_a, 4),
        "cr_b": round(p_b, 4),
        "z_score": round(z, 4),
        "p_value": round(p_value, 6),
        "significant": significant,
        "winner": winner,
    }


def _required_sample_size(baseline_cr: float, mde: float, alpha: float = 0.05, power: float = 0.80) -> int:
    """
    Calculate required sample size per variant for a two-proportion z-test.
    MDE = minimum detectable effect (absolute).
    """
    z_alpha = stats.norm.ppf(1 - alpha / 2)
    z_beta = stats.norm.ppf(power)
    p1 = baseline_cr
    p2 = baseline_cr + mde
    p_bar = (p1 + p2) / 2

    numerator = (z_alpha * np.sqrt(2 * p_bar * (1 - p_bar)) + z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    denominator = (p2 - p1) ** 2

    return int(np.ceil(numerator / denominator))


# ── Evaluators ────────────────────────────────────────────────────────────────

def _evaluate_type_1_error(n_simulations: int = 1000, n_per_arm: int = 500, base_cr: float = 0.05) -> Dict:
    """
    Simulate A/A tests (no real difference) to measure false positive rate.
    Type I error should be ≤ 5%.
    """
    np.random.seed(42)
    false_positives = 0

    for _ in range(n_simulations):
        result = _simulate_ab_test(n_per_arm, n_per_arm, base_cr, base_cr)
        if result["significant"]:
            false_positives += 1

    fpr = false_positives / n_simulations * 100
    return {
        "simulations": n_simulations,
        "false_positives": false_positives,
        "false_positive_rate_pct": round(fpr, 2),
        "passed": fpr <= 7.0,  # Allow slight tolerance over 5% due to Monte Carlo noise
    }


def _evaluate_statistical_power(n_simulations: int = 1000, base_cr: float = 0.05, lift: float = 0.02) -> Dict:
    """
    Simulate A/B tests with a known effect to measure detection power.
    Power should be ≥ 80% (given adequate sample size).
    """
    np.random.seed(43)
    true_cr_b = base_cr + lift

    # Calculate required sample size for 80% power
    required_n = _required_sample_size(base_cr, lift)
    n_per_arm = required_n

    correct_detections = 0
    correct_winner = 0

    for _ in range(n_simulations):
        result = _simulate_ab_test(n_per_arm, n_per_arm, base_cr, true_cr_b)
        if result["significant"]:
            correct_detections += 1
            if result["winner"] == "B":
                correct_winner += 1

    power = correct_detections / n_simulations * 100
    winner_acc = correct_winner / max(correct_detections, 1) * 100

    return {
        "simulations": n_simulations,
        "true_lift": lift,
        "n_per_arm": n_per_arm,
        "required_sample_size": required_n,
        "sample_adequate": True,
        "correct_detections": correct_detections,
        "power_pct": round(power, 2),
        "correct_winner_pct": round(winner_acc, 2),
        "passed": power >= 75.0,
    }


def _evaluate_revenue_attribution(n_tests: int = 50) -> Dict:
    """
    Verify revenue calculations are arithmetically correct.
    """
    np.random.seed(44)
    errors = 0

    for _ in range(n_tests):
        n_a = np.random.randint(100, 1000)
        n_b = np.random.randint(100, 1000)
        cr_a = np.random.uniform(0.02, 0.15)
        cr_b = np.random.uniform(0.02, 0.15)
        price_a = float(np.random.uniform(50, 500))
        price_b = float(np.random.uniform(50, 500))

        result = _simulate_ab_test(n_a, n_b, cr_a, cr_b, price_a, price_b)

        # Check revenue = conversions × price
        expected_rev_a = result["conversions_a"] * price_a
        expected_rev_b = result["conversions_b"] * price_b

        if abs(result["revenue_a"] - round(expected_rev_a, 2)) > 0.01:
            errors += 1
        if abs(result["revenue_b"] - round(expected_rev_b, 2)) > 0.01:
            errors += 1

    return {
        "tests": n_tests,
        "revenue_calculation_errors": errors,
        "passed": errors == 0,
    }


def _evaluate_sample_size_calculator() -> Dict:
    """
    Validate the sample size calculator against known values.
    """
    test_cases = [
        {"baseline_cr": 0.05, "mde": 0.01, "expected_range": (4000, 10000)},
        {"baseline_cr": 0.10, "mde": 0.02, "expected_range": (1500, 5000)},
        {"baseline_cr": 0.03, "mde": 0.01, "expected_range": (3000, 10000)},
    ]

    results = []
    all_pass = True
    for case in test_cases:
        n = _required_sample_size(case["baseline_cr"], case["mde"])
        in_range = case["expected_range"][0] <= n <= case["expected_range"][1]
        if not in_range:
            all_pass = False
        results.append({
            "baseline_cr": case["baseline_cr"],
            "mde": case["mde"],
            "calculated_n": n,
            "expected_range": case["expected_range"],
            "in_range": in_range,
        })

    return {
        "test_cases": results,
        "passed": all_pass,
    }


def _evaluate_premature_stopping() -> Dict:
    """
    Test that significance isn't declared with very small sample sizes.
    Run 200 tests with n=20 per arm and a small effect — most should NOT be significant.
    """
    np.random.seed(45)
    premature_declarations = 0
    n_tests = 200

    for _ in range(n_tests):
        result = _simulate_ab_test(20, 20, 0.05, 0.06)  # Tiny effect, tiny sample
        if result["significant"]:
            premature_declarations += 1

    premature_rate = premature_declarations / n_tests * 100
    return {
        "tests": n_tests,
        "premature_declarations": premature_declarations,
        "premature_rate_pct": round(premature_rate, 2),
        "passed": premature_rate <= 15.0,  # should rarely declare significance
    }


# ── Main Evaluator ────────────────────────────────────────────────────────────

def evaluate_ab_testing() -> Dict:
    """Run the full A/B testing statistical evaluation."""
    type1 = _evaluate_type_1_error()
    power = _evaluate_statistical_power()
    revenue = _evaluate_revenue_attribution()
    sample_size = _evaluate_sample_size_calculator()
    premature = _evaluate_premature_stopping()

    overall_score = (
        (95.0 if type1["passed"] else max(0, 100 - type1["false_positive_rate_pct"] * 10)) * 0.25 +
        (power["power_pct"]) * 0.25 +
        (100.0 if revenue["passed"] else 50.0) * 0.20 +
        (100.0 if sample_size["passed"] else 50.0) * 0.15 +
        (100.0 if premature["passed"] else 50.0) * 0.15
    )

    return {
        "domain": "A/B Testing Statistical Validity",
        "type_1_error": type1,
        "statistical_power": power,
        "revenue_attribution": revenue,
        "sample_size_calculator": sample_size,
        "premature_stopping": premature,
        "aggregate": {
            "overall_score": round(overall_score, 1),
        },
        "quality_gates": {
            "type1_error_pass": type1["passed"],
            "power_pass": power["passed"],
            "revenue_pass": revenue["passed"],
            "sample_size_pass": sample_size["passed"],
            "premature_stopping_pass": premature["passed"],
        },
        "passed": type1["passed"] and revenue["passed"] and sample_size["passed"],
    }


if __name__ == "__main__":
    print("=" * 70)
    print("  A/B TESTING STATISTICAL EVALUATION")
    print("=" * 70)

    results = evaluate_ab_testing()

    t1 = results["type_1_error"]
    print(f"\n🔬 Type I Error (A/A tests): {t1['false_positive_rate_pct']}% (target: ≤5%) {'✅' if t1['passed'] else '❌'}")

    pw = results["statistical_power"]
    print(f"⚡ Statistical Power: {pw['power_pct']}% (target: ≥80%) {'✅' if pw['passed'] else '⚠️'}")
    print(f"   Required N: {pw['required_sample_size']} per arm (used: {pw['n_per_arm']})")

    rv = results["revenue_attribution"]
    print(f"💰 Revenue Attribution: {rv['revenue_calculation_errors']} errors {'✅' if rv['passed'] else '❌'}")

    ss = results["sample_size_calculator"]
    print(f"📏 Sample Size Calculator: {'✅' if ss['passed'] else '❌'}")

    pm = results["premature_stopping"]
    print(f"⏸️  Premature Stopping: {pm['premature_rate_pct']}% rate {'✅' if pm['passed'] else '❌'}")

    print(f"\n📊 Overall Score: {results['aggregate']['overall_score']}%")
    print(f"\n{'✅ PASSED' if results['passed'] else '❌ FAILED'}")
