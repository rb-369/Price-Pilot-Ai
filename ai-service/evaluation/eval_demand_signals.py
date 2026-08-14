"""
PricePilot AI — Demand Signal Scoring Evaluator
Validates the composite demand signal analysis pipeline for directional
consistency, signal isolation, sensitivity, and edge case handling.
"""
import sys
import os
import numpy as np
from typing import Dict, List

# Fix Windows console encoding for Unicode/emoji
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.pricing import _analyze_demand
from evaluation.metrics import classification_accuracy


# ── Signal Isolation Tests ────────────────────────────────────────────────────

SIGNAL_ISOLATION_CASES = [
    {
        "name": "high_search_trend_only",
        "signals": [{"compositeDemandScore": 0.55, "searchTrendScore": 85}] * 7,
        "expected_sign": "positive",
        "description": "Search trend score high → demand factor should be positive",
    },
    {
        "name": "low_search_trend_only",
        "signals": [{"compositeDemandScore": 0.50, "searchTrendScore": 15}] * 7,
        "expected_sign": "negative",
        "description": "Search trend score low → demand factor should be negative or zero",
    },
    {
        "name": "positive_sentiment_only",
        "signals": [{"compositeDemandScore": 0.50, "searchTrendScore": 50, "socialSentimentScore": 0.7}] * 7,
        "expected_sign": "positive",
        "description": "Strong positive sentiment → demand factor positive",
    },
    {
        "name": "negative_sentiment_only",
        "signals": [{"compositeDemandScore": 0.50, "searchTrendScore": 50, "socialSentimentScore": -0.5}] * 7,
        "expected_sign": "negative",
        "description": "Strong negative sentiment → demand factor negative",
    },
    {
        "name": "event_boost_high",
        "signals": [{"compositeDemandScore": 0.50, "searchTrendScore": 50, "eventFactor": 0.5}] * 7,
        "expected_sign": "positive",
        "description": "Active event boost → positive demand factor",
    },
    {
        "name": "rising_demand_wow",
        "signals": (
            [{"compositeDemandScore": 0.80}] * 7 +
            [{"compositeDemandScore": 0.30}] * 7
        ),
        "expected_sign": "positive",
        "description": "Week-over-week demand rising sharply → positive factor",
    },
    {
        "name": "declining_demand_wow",
        "signals": (
            [{"compositeDemandScore": 0.30}] * 7 +
            [{"compositeDemandScore": 0.80}] * 7
        ),
        "expected_sign": "negative",
        "description": "Week-over-week demand declining sharply → negative factor",
    },
]


# ── Composite Score Sanity Tests ──────────────────────────────────────────────

COMPOSITE_SANITY_CASES = [
    {
        "name": "all_positive_signals",
        "signals": [
            {"compositeDemandScore": 0.85, "searchTrendScore": 90, "socialSentimentScore": 0.7, "eventFactor": 0.4}
        ] * 7 + [{"compositeDemandScore": 0.50}] * 7,  # older for comparison
        "expected_sign": "positive",
    },
    {
        "name": "all_negative_signals",
        "signals": [
            {"compositeDemandScore": 0.20, "searchTrendScore": 10, "socialSentimentScore": -0.6}
        ] * 7 + [{"compositeDemandScore": 0.60}] * 7,
        "expected_sign": "negative",
    },
    {
        "name": "conflicting_signals_should_attenuate",
        "signals": [
            {"compositeDemandScore": 0.50, "searchTrendScore": 90, "socialSentimentScore": -0.5}
        ] * 7,
        "expected_sign": "neutral",  # mixed signals → small magnitude
        "max_magnitude": 0.05,
    },
]


# ── Edge Cases ────────────────────────────────────────────────────────────────

EDGE_CASES = [
    {
        "name": "empty_signals",
        "signals": [],
        "expected_factor": 0.0,
        "expected_context": "",
    },
    {
        "name": "single_signal",
        "signals": [{"compositeDemandScore": 0.60}],
        "expect_no_crash": True,
    },
    {
        "name": "extreme_high_scores",
        "signals": [{"compositeDemandScore": 1.0, "searchTrendScore": 100, "socialSentimentScore": 1.0, "eventFactor": 1.0}] * 14,
        "expect_bounded": True,
        "max_factor": 0.20,  # should not exceed system bounds
    },
    {
        "name": "all_zeros",
        "signals": [{"compositeDemandScore": 0.0, "searchTrendScore": 0}] * 7,
        "expect_no_crash": True,
    },
]


def _check_sign(factor: float, expected_sign: str, max_magnitude: float = None) -> bool:
    """Check if factor matches expected sign."""
    if expected_sign == "positive":
        return factor > 0
    elif expected_sign == "negative":
        return factor < 0
    elif expected_sign == "neutral":
        if max_magnitude is not None:
            return abs(factor) <= max_magnitude
        return abs(factor) < 0.05
    return True


def evaluate_demand_signals() -> Dict:
    """Run the full demand signal scoring evaluation."""
    results = {
        "domain": "Demand Signal Analysis",
        "isolation_tests": [],
        "composite_tests": [],
        "edge_cases": [],
        "sensitivity": {},
        "aggregate": {},
    }

    # ── Signal Isolation ──────────────────────────────────────────────────────
    isolation_correct = 0
    for case in SIGNAL_ISOLATION_CASES:
        factor, context = _analyze_demand(case["signals"])
        ok = _check_sign(factor, case["expected_sign"])
        if ok:
            isolation_correct += 1
        results["isolation_tests"].append({
            "name": case["name"],
            "factor": factor,
            "expected_sign": case["expected_sign"],
            "correct": ok,
            "context": context,
        })

    # ── Composite Sanity ──────────────────────────────────────────────────────
    composite_correct = 0
    for case in COMPOSITE_SANITY_CASES:
        factor, context = _analyze_demand(case["signals"])
        max_mag = case.get("max_magnitude")
        ok = _check_sign(factor, case["expected_sign"], max_mag)
        if ok:
            composite_correct += 1
        results["composite_tests"].append({
            "name": case["name"],
            "factor": factor,
            "expected_sign": case["expected_sign"],
            "correct": ok,
        })

    # ── Edge Cases ────────────────────────────────────────────────────────────
    edge_correct = 0
    for case in EDGE_CASES:
        try:
            factor, context = _analyze_demand(case["signals"])
            crashed = False
        except Exception as e:
            factor, context, crashed = 0.0, str(e), True

        ok = True
        if case.get("expected_factor") is not None:
            ok = factor == case["expected_factor"]
        if case.get("expect_bounded"):
            ok = ok and abs(factor) <= case.get("max_factor", 0.20)
        if case.get("expect_no_crash"):
            ok = ok and not crashed

        if ok:
            edge_correct += 1
        results["edge_cases"].append({
            "name": case["name"],
            "factor": factor,
            "correct": ok,
            "crashed": crashed,
        })

    # ── Sensitivity Analysis ──────────────────────────────────────────────────
    # Vary demand score from 0.1 to 0.9, keep others stable, measure factor
    sensitivity_points = []
    for score in np.arange(0.1, 1.0, 0.1):
        signals_recent = [{"compositeDemandScore": float(score), "searchTrendScore": 50}] * 7
        signals_older = [{"compositeDemandScore": 0.5}] * 7
        all_signals = signals_recent + signals_older
        factor, _ = _analyze_demand(all_signals)
        sensitivity_points.append({"demand_score": round(float(score), 1), "factor": round(factor, 4)})

    # Check monotonicity: higher demand score should generally yield higher factor
    factors = [p["factor"] for p in sensitivity_points]
    monotonic_violations = 0
    for i in range(1, len(factors)):
        if factors[i] < factors[i - 1] - 0.02:  # small tolerance
            monotonic_violations += 1

    results["sensitivity"] = {
        "points": sensitivity_points,
        "monotonic_violations": monotonic_violations,
        "approximately_monotonic": monotonic_violations <= 2,
    }

    # ── Aggregate ─────────────────────────────────────────────────────────────
    total_tests = len(SIGNAL_ISOLATION_CASES) + len(COMPOSITE_SANITY_CASES) + len(EDGE_CASES)
    total_correct = isolation_correct + composite_correct + edge_correct
    accuracy = (total_correct / total_tests) * 100

    results["aggregate"] = {
        "isolation_accuracy_pct": round((isolation_correct / len(SIGNAL_ISOLATION_CASES)) * 100, 1),
        "composite_accuracy_pct": round((composite_correct / len(COMPOSITE_SANITY_CASES)) * 100, 1),
        "edge_case_accuracy_pct": round((edge_correct / len(EDGE_CASES)) * 100, 1),
        "overall_accuracy_pct": round(accuracy, 1),
        "overall_score": round(accuracy, 1),
        "sensitivity_monotonic": results["sensitivity"]["approximately_monotonic"],
    }

    results["quality_gates"] = {
        "directional_consistency_pass": accuracy >= 90.0,
        "sensitivity_monotonic_pass": results["sensitivity"]["approximately_monotonic"],
    }
    results["passed"] = all(results["quality_gates"].values())

    return results


if __name__ == "__main__":
    print("=" * 70)
    print("  DEMAND SIGNAL SCORING EVALUATION")
    print("=" * 70)

    results = evaluate_demand_signals()

    print("\n📡 Signal Isolation Tests:")
    for t in results["isolation_tests"]:
        status = "✅" if t["correct"] else "❌"
        print(f"  {status} {t['name']}: factor={t['factor']:.4f} (expected: {t['expected_sign']})")

    print("\n📊 Composite Sanity Tests:")
    for t in results["composite_tests"]:
        status = "✅" if t["correct"] else "❌"
        print(f"  {status} {t['name']}: factor={t['factor']:.4f}")

    print("\n⚠️  Edge Cases:")
    for t in results["edge_cases"]:
        status = "✅" if t["correct"] else "❌"
        print(f"  {status} {t['name']}: factor={t['factor']:.4f}, crashed={t['crashed']}")

    agg = results["aggregate"]
    print(f"\n📊 Overall Accuracy: {agg['overall_accuracy_pct']}%")
    print(f"📈 Sensitivity Monotonic: {agg['sensitivity_monotonic']}")
    print(f"\n{'✅ PASSED' if results['passed'] else '❌ FAILED'}")
