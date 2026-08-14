"""
PricePilot AI — Pricing Recommendation Accuracy Evaluator
Tests directional correctness, margin compliance, revenue impact accuracy,
and deterministic consistency of the pricing engine.
"""
import sys
import os
import json
import numpy as np
from typing import Dict, List, Tuple

# Fix Windows console encoding for Unicode/emoji
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.pricing import optimize_price, suggest_promotion
from services.validator import validate_price_margin_guardrail
from evaluation.metrics import mae, mape, directional_accuracy, hit_rate_at_k


# ── Scenario Battery ──────────────────────────────────────────────────────────

PRICING_SCENARIOS: List[Dict] = [
    # ── High demand + low stock → should INCREASE ──
    {
        "name": "high_demand_low_stock",
        "product": {"currentPrice": 1000, "baseCost": 600, "minMargin": 0.10, "stockLevel": 8, "reorderThreshold": 20},
        "competitors": [{"name": "Comp A", "price": 1050, "inStock": True, "rating": 4.2}],
        "demand_signals": [{"compositeDemandScore": 0.85, "searchTrendScore": 80, "socialSentimentScore": 0.5}] * 7,
        "expected_direction": "increase",
    },
    {
        "name": "high_demand_critical_stock",
        "product": {"currentPrice": 800, "baseCost": 400, "minMargin": 0.10, "stockLevel": 3, "reorderThreshold": 15},
        "competitors": [{"name": "Comp A", "price": 820, "inStock": True, "rating": 4.0}],
        "demand_signals": [{"compositeDemandScore": 0.90, "searchTrendScore": 90, "socialSentimentScore": 0.7}] * 7,
        "expected_direction": "increase",
    },
    # ── Low demand + overstock → should DECREASE ──
    {
        "name": "low_demand_overstock",
        "product": {"currentPrice": 1500, "baseCost": 800, "minMargin": 0.10, "stockLevel": 200, "reorderThreshold": 20},
        "competitors": [
            {"name": "Comp A", "price": 1350, "inStock": True, "rating": 4.5},
            {"name": "Comp B", "price": 1400, "inStock": True, "rating": 4.0},
        ],
        "demand_signals": [{"compositeDemandScore": 0.25, "searchTrendScore": 15, "socialSentimentScore": -0.3}] * 7,
        "expected_direction": "hold_or_decrease",
    },
    {
        "name": "weak_demand_heavy_overstock",
        "product": {"currentPrice": 2000, "baseCost": 1000, "minMargin": 0.10, "stockLevel": 500, "reorderThreshold": 30},
        "competitors": [{"name": "Comp A", "price": 1800, "inStock": True, "rating": 4.3}],
        "demand_signals": [{"compositeDemandScore": 0.20, "searchTrendScore": 10, "socialSentimentScore": -0.5}] * 7,
        "expected_direction": "hold_or_decrease",
    },
    # ── Competitor significantly cheaper → should DECREASE ──
    {
        "name": "competitor_undercut",
        "product": {"currentPrice": 1200, "baseCost": 600, "minMargin": 0.10, "stockLevel": 50, "reorderThreshold": 20},
        "competitors": [
            {"name": "Comp A", "price": 900, "inStock": True, "rating": 4.5},
            {"name": "Comp B", "price": 950, "inStock": True, "rating": 4.2},
        ],
        "demand_signals": [{"compositeDemandScore": 0.50, "searchTrendScore": 50}] * 7,
        "expected_direction": "hold_or_decrease",
    },
    # ── All competitors OOS → should INCREASE ──
    {
        "name": "all_competitors_oos",
        "product": {"currentPrice": 1000, "baseCost": 600, "minMargin": 0.10, "stockLevel": 50, "reorderThreshold": 20},
        "competitors": [
            {"name": "Comp A", "price": 1050, "inStock": False, "rating": 4.0},
            {"name": "Comp B", "price": 980, "inStock": False, "rating": 3.8},
        ],
        "demand_signals": [{"compositeDemandScore": 0.60, "searchTrendScore": 60}] * 7,
        "expected_direction": "increase",
    },
    # ── Priced below market → should INCREASE ──
    {
        "name": "priced_below_market",
        "product": {"currentPrice": 700, "baseCost": 400, "minMargin": 0.10, "stockLevel": 40, "reorderThreshold": 20},
        "competitors": [
            {"name": "Comp A", "price": 1000, "inStock": True, "rating": 4.0},
            {"name": "Comp B", "price": 1100, "inStock": True, "rating": 4.3},
            {"name": "Comp C", "price": 950, "inStock": True, "rating": 3.9},
        ],
        "demand_signals": [{"compositeDemandScore": 0.55, "searchTrendScore": 55}] * 7,
        "expected_direction": "increase",
    },
    # ── Stable market, healthy stock → should HOLD ──
    {
        "name": "stable_market_healthy_stock",
        "product": {"currentPrice": 1000, "baseCost": 600, "minMargin": 0.10, "stockLevel": 60, "reorderThreshold": 20},
        "competitors": [
            {"name": "Comp A", "price": 1010, "inStock": True, "rating": 4.0},
            {"name": "Comp B", "price": 990, "inStock": True, "rating": 4.1},
        ],
        "demand_signals": [{"compositeDemandScore": 0.52, "searchTrendScore": 50, "socialSentimentScore": 0.05}] * 7,
        "expected_direction": "hold_or_increase",
    },
    # ── Rising demand, search trending → should INCREASE ──
    {
        "name": "rising_demand_trending",
        "product": {"currentPrice": 500, "baseCost": 250, "minMargin": 0.10, "stockLevel": 30, "reorderThreshold": 15},
        "competitors": [{"name": "Comp A", "price": 520, "inStock": True, "rating": 4.0}],
        "demand_signals": (
            [{"compositeDemandScore": 0.80, "searchTrendScore": 85, "socialSentimentScore": 0.6}] * 7 +
            [{"compositeDemandScore": 0.40, "searchTrendScore": 40}] * 7
        ),
        "expected_direction": "increase",
    },
    # ── Declining demand, negative sentiment → should DECREASE or HOLD ──
    {
        "name": "declining_demand_negative_sentiment",
        "product": {"currentPrice": 1200, "baseCost": 700, "minMargin": 0.10, "stockLevel": 80, "reorderThreshold": 20},
        "competitors": [{"name": "Comp A", "price": 1150, "inStock": True, "rating": 4.2}],
        "demand_signals": (
            [{"compositeDemandScore": 0.30, "searchTrendScore": 20, "socialSentimentScore": -0.4}] * 7 +
            [{"compositeDemandScore": 0.70, "searchTrendScore": 70}] * 7
        ),
        "expected_direction": "hold_or_decrease",
    },
    # ── Premium positioning (above market but strong brand) → should HOLD or increase ──
    {
        "name": "premium_positioning_strong_demand",
        "product": {"currentPrice": 1500, "baseCost": 700, "minMargin": 0.15, "stockLevel": 25, "reorderThreshold": 10},
        "competitors": [
            {"name": "Comp A", "price": 1200, "inStock": True, "rating": 3.5},
            {"name": "Comp B", "price": 1100, "inStock": True, "rating": 3.8},
        ],
        "demand_signals": [{"compositeDemandScore": 0.75, "searchTrendScore": 75, "socialSentimentScore": 0.6}] * 7,
        "expected_direction": "hold_or_increase",
    },
    # ── No competitor data → should rely on demand signals ──
    {
        "name": "no_competitors_high_demand",
        "product": {"currentPrice": 800, "baseCost": 400, "minMargin": 0.10, "stockLevel": 15, "reorderThreshold": 20},
        "competitors": [],
        "demand_signals": [{"compositeDemandScore": 0.85, "searchTrendScore": 80}] * 7,
        "expected_direction": "increase",
    },
    # ── No demand signals → should rely on competitor data ──
    {
        "name": "no_demand_signals_overpriced",
        "product": {"currentPrice": 1500, "baseCost": 800, "minMargin": 0.10, "stockLevel": 50, "reorderThreshold": 20},
        "competitors": [
            {"name": "Comp A", "price": 1100, "inStock": True, "rating": 4.5},
            {"name": "Comp B", "price": 1150, "inStock": True, "rating": 4.3},
        ],
        "demand_signals": [],
        "expected_direction": "hold_or_decrease",
    },
    # ── Edge: price equals base cost → should increase ──
    {
        "name": "price_at_cost",
        "product": {"currentPrice": 500, "baseCost": 500, "minMargin": 0.10, "stockLevel": 50, "reorderThreshold": 20},
        "competitors": [{"name": "Comp A", "price": 700, "inStock": True, "rating": 4.0}],
        "demand_signals": [{"compositeDemandScore": 0.60, "searchTrendScore": 55}] * 7,
        "expected_direction": "increase",
    },
    # ── Event boost active → should increase ──
    {
        "name": "event_boost_active",
        "product": {"currentPrice": 900, "baseCost": 500, "minMargin": 0.10, "stockLevel": 40, "reorderThreshold": 20},
        "competitors": [{"name": "Comp A", "price": 920, "inStock": True, "rating": 4.0}],
        "demand_signals": [{"compositeDemandScore": 0.70, "searchTrendScore": 70, "eventFactor": 0.5}] * 7,
        "expected_direction": "increase",
    },
]


def _direction_matches(recommended: float, current: float, expected: str) -> bool:
    """Check if the recommendation direction matches expectation."""
    pct_change = (recommended - current) / current if current > 0 else 0

    if expected == "increase":
        return recommended > current
    elif expected == "decrease":
        return recommended < current
    elif expected == "hold":
        return abs(pct_change) < 0.05  # within 5% is "hold"
    elif expected == "hold_or_increase":
        return recommended >= current or abs(pct_change) < 0.05
    elif expected == "hold_or_decrease":
        return recommended <= current or abs(pct_change) < 0.05
    return False


def evaluate_pricing() -> Dict:
    """Run the full pricing recommendation accuracy evaluation."""
    results = {
        "domain": "Pricing Recommendations",
        "scenarios": [],
        "aggregate": {},
    }

    directional_correct = 0
    total_scenarios = len(PRICING_SCENARIOS)
    margin_violations = 0
    consistency_failures = 0

    for scenario in PRICING_SCENARIOS:
        product = scenario["product"]
        competitors = scenario["competitors"]
        demand_signals = scenario["demand_signals"]
        expected = scenario["expected_direction"]

        rec = optimize_price(product, competitors, demand_signals)
        recommended_price = rec["recommendedPrice"]
        current_price = product["currentPrice"]

        # Direction check
        direction_ok = _direction_matches(recommended_price, current_price, expected)
        if direction_ok:
            directional_correct += 1

        # Margin guardrail check
        min_price = product["baseCost"] * (1 + product["minMargin"])
        margin_ok = recommended_price >= min_price
        if not margin_ok:
            margin_violations += 1

        # Consistency check: run twice, same result
        rec2 = optimize_price(product, competitors, demand_signals)
        consistent = rec2["recommendedPrice"] == recommended_price
        if not consistent:
            consistency_failures += 1

        scenario_result = {
            "name": scenario["name"],
            "expected_direction": expected,
            "recommended_price": recommended_price,
            "current_price": current_price,
            "price_change_pct": rec.get("priceChange", 0),
            "direction_correct": direction_ok,
            "margin_compliant": margin_ok,
            "consistent": consistent,
            "confidence_score": rec.get("confidenceScore", 0),
            "revenue_impact": rec.get("revenueImpact", 0),
        }
        results["scenarios"].append(scenario_result)

    # ── Margin Guardrail Fuzzing (10,000 inputs) ──────────────────────────────
    np.random.seed(42)
    fuzz_breaches = 0
    for _ in range(10000):
        cogs = float(np.random.uniform(50, 5000))
        min_margin = float(np.random.uniform(0.05, 0.35))
        candidate = float(np.random.uniform(cogs * 0.5, cogs * 2.0))
        guard = validate_price_margin_guardrail(candidate, cogs, min_margin)
        floor = np.ceil(cogs * (1.0 + min_margin))
        if guard["recommendedPrice"] < floor:
            fuzz_breaches += 1

    # ── Aggregate Scores ──────────────────────────────────────────────────────
    dir_accuracy = (directional_correct / total_scenarios) * 100
    margin_compliance = ((total_scenarios - margin_violations) / total_scenarios) * 100
    fuzz_compliance = ((10000 - fuzz_breaches) / 10000) * 100
    consistency_rate = ((total_scenarios - consistency_failures) / total_scenarios) * 100

    # Overall weighted score
    overall = (dir_accuracy * 0.4 + margin_compliance * 0.2 + fuzz_compliance * 0.2 + consistency_rate * 0.2)

    results["aggregate"] = {
        "directional_accuracy_pct": round(dir_accuracy, 1),
        "margin_compliance_pct": round(margin_compliance, 1),
        "fuzz_guardrail_compliance_pct": round(fuzz_compliance, 1),
        "consistency_rate_pct": round(consistency_rate, 1),
        "fuzz_breaches": fuzz_breaches,
        "margin_violations": margin_violations,
        "overall_score": round(overall, 1),
        "scenarios_passed": directional_correct,
        "scenarios_total": total_scenarios,
    }

    # Quality gates
    results["quality_gates"] = {
        "directional_accuracy_pass": dir_accuracy >= 85.0,
        "margin_guardrail_pass": fuzz_breaches == 0,
        "consistency_pass": consistency_failures == 0,
    }
    results["passed"] = all(results["quality_gates"].values())

    return results


# ── Promotion Evaluator ───────────────────────────────────────────────────────

PROMOTION_SCENARIOS = [
    {
        "name": "overstock_weak_demand_should_promote",
        "product": {"currentPrice": 1000, "baseCost": 500, "minMargin": 0.10, "stockLevel": 200, "reorderThreshold": 20},
        "demand_signals": [{"compositeDemandScore": 0.30}] * 7,
        "should_promote": True,
    },
    {
        "name": "healthy_stock_strong_demand_no_promote",
        "product": {"currentPrice": 1000, "baseCost": 500, "minMargin": 0.10, "stockLevel": 30, "reorderThreshold": 20},
        "demand_signals": [{"compositeDemandScore": 0.80}] * 7,
        "should_promote": False,
    },
    {
        "name": "moderate_overstock_moderate_demand_no_promote",
        "product": {"currentPrice": 800, "baseCost": 400, "minMargin": 0.10, "stockLevel": 35, "reorderThreshold": 20},
        "demand_signals": [{"compositeDemandScore": 0.70}] * 7,
        "should_promote": False,
    },
    {
        "name": "extreme_overstock_very_weak_demand",
        "product": {"currentPrice": 2000, "baseCost": 1000, "minMargin": 0.10, "stockLevel": 600, "reorderThreshold": 30},
        "demand_signals": [{"compositeDemandScore": 0.15}] * 7,
        "should_promote": True,
    },
]


def evaluate_promotions() -> Dict:
    """Evaluate promotion suggestion accuracy."""
    correct = 0
    results_list = []

    for scenario in PROMOTION_SCENARIOS:
        rec = suggest_promotion(scenario["product"], scenario["demand_signals"])
        got_promote = rec["shouldPromote"]
        expected = scenario["should_promote"]
        ok = got_promote == expected
        if ok:
            correct += 1
        results_list.append({
            "name": scenario["name"],
            "expected_promote": expected,
            "got_promote": got_promote,
            "correct": ok,
            "discount_pct": rec.get("discountPercentage"),
        })

    accuracy = (correct / len(PROMOTION_SCENARIOS)) * 100
    return {
        "domain": "Promotion Suggestions",
        "scenarios": results_list,
        "accuracy_pct": round(accuracy, 1),
        "passed": accuracy >= 75.0,
    }


if __name__ == "__main__":
    print("=" * 70)
    print("  PRICING RECOMMENDATION ACCURACY EVALUATION")
    print("=" * 70)
    
    pricing_results = evaluate_pricing()
    promo_results = evaluate_promotions()

    print(f"\n📊 Directional Accuracy:  {pricing_results['aggregate']['directional_accuracy_pct']}%")
    print(f"🛡️  Margin Compliance:     {pricing_results['aggregate']['margin_compliance_pct']}%")
    print(f"🔒 Fuzz Guardrail:        {pricing_results['aggregate']['fuzz_guardrail_compliance_pct']}%")
    print(f"🔁 Consistency:           {pricing_results['aggregate']['consistency_rate_pct']}%")
    print(f"📈 Overall Score:         {pricing_results['aggregate']['overall_score']}%")
    print(f"🏷️  Promotion Accuracy:    {promo_results['accuracy_pct']}%")

    print("\n--- Scenario Details ---")
    for s in pricing_results["scenarios"]:
        status = "✅" if s["direction_correct"] else "❌"
        print(f"  {status} {s['name']}: ₹{s['current_price']} → ₹{s['recommended_price']} (expected: {s['expected_direction']})")

    print(f"\n{'✅ PASSED' if pricing_results['passed'] else '❌ FAILED'}")
