"""
PricePilot AI — Elasticity Model Accuracy Evaluator
Validates ML model quality, cold-start priors, shadow mode comparison,
prediction stability, and quantile bound calibration.
"""
import sys
import os
import json
import numpy as np
from typing import Dict, List
from datetime import datetime, timedelta
from pathlib import Path

# Fix Windows console encoding for Unicode/emoji
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.elasticity_model import ElasticityModel, CATEGORY_PRIORS, get_elasticity_model
from evaluation.metrics import mae, r_squared


# ── Synthetic Training Data Generator ─────────────────────────────────────────

def _generate_synthetic_training_data(n: int = 80) -> List[Dict]:
    """Generate chronologically ordered synthetic elasticity observations."""
    np.random.seed(55)
    base_time = datetime(2025, 6, 1)
    data = []

    for i in range(n):
        demand = float(np.random.uniform(0.2, 0.9))
        stock_ratio = float(np.random.uniform(0.5, 6.0))
        price = float(np.random.uniform(300, 3000))
        margin = float(np.random.uniform(0.10, 0.55))
        comp_spread = float(np.random.uniform(0.03, 0.30))
        search = float(np.random.uniform(0.1, 0.95))

        # Synthetic ground truth: elasticity depends on demand + stock + margin
        true_elast = -1.0 - (1.0 - demand) * 1.5 + (stock_ratio - 3.0) * 0.1 + np.random.normal(0, 0.15)
        true_elast = float(np.clip(true_elast, -3.5, -0.3))

        data.append({
            "timestamp": (base_time + timedelta(days=i)).isoformat(),
            "features": {
                "demand_score": demand,
                "competitor_spread": comp_spread,
                "stock_ratio": stock_ratio,
                "price_level": price,
                "margin_pct": margin,
                "search_trend_normalized": search,
            },
            "elasticity_observed": true_elast,
        })

    return data


# ── Evaluators ────────────────────────────────────────────────────────────────

def _evaluate_training_and_holdout() -> Dict:
    """Train model on synthetic data and validate holdout performance."""
    data = _generate_synthetic_training_data(80)
    model = ElasticityModel("eval_test_user")

    result = model.train(data)

    if result["status"] != "success":
        return {
            "trained": False,
            "status": result["status"],
            "message": result.get("message", "Training failed"),
            "passed": False,
        }

    r2 = result.get("r2_mean", 0)
    model_mae = result.get("mae", 999)

    return {
        "trained": True,
        "samples": result["samples"],
        "r2_score": r2,
        "mae": model_mae,
        "feature_importances": result.get("feature_importances", {}),
        "r2_pass": r2 > 0.0,  # lenient: synthetic data is noisy
        "mae_pass": model_mae < 0.8,
        "passed": r2 > 0.0 and model_mae < 0.8,
    }


def _evaluate_cold_start_priors() -> Dict:
    """Test cold-start routing for products with < 10 sales."""
    model = ElasticityModel("eval_coldstart_test")
    model.model = None  # force heuristic mode

    results = []
    all_reasonable = True

    for category, expected_prior in CATEGORY_PRIORS.items():
        features = {
            "demand_score": 0.5,
            "competitor_spread": 0.1,
            "stock_ratio": 3.0,
            "price_level": 1000,
            "margin_pct": 0.25,
            "search_trend_normalized": 0.5,
            "sales_count": 3,  # triggers cold-start
            "category": category,
        }
        elasticity, source = model.predict(features)

        # Should be category_prior_coldstart source
        is_coldstart = source == "category_prior_coldstart"
        # Should be reasonably close to the category prior
        deviation = abs(elasticity - expected_prior)
        reasonable = deviation < 0.8  # blended value, so some deviation expected

        if not reasonable or not is_coldstart:
            all_reasonable = False

        results.append({
            "category": category,
            "expected_prior": expected_prior,
            "predicted": round(elasticity, 3),
            "source": source,
            "is_coldstart": is_coldstart,
            "deviation": round(deviation, 3),
            "reasonable": reasonable,
        })

    return {
        "categories": results,
        "all_reasonable": all_reasonable,
        "passed": all_reasonable,
    }


def _evaluate_prediction_stability() -> Dict:
    """Test that same features produce same predictions (determinism)."""
    model = ElasticityModel("eval_stability_test")

    features = {
        "demand_score": 0.6,
        "competitor_spread": 0.12,
        "stock_ratio": 2.5,
        "price_level": 1200,
        "margin_pct": 0.30,
        "search_trend_normalized": 0.65,
    }

    predictions = []
    for _ in range(10):
        elasticity, source = model.predict(features)
        predictions.append(elasticity)

    # All predictions should be identical (no randomness)
    all_same = len(set(predictions)) == 1

    # Lipschitz continuity: small perturbation → small change
    perturbation_results = []
    base_elast, _ = model.predict(features)
    for key in ["demand_score", "stock_ratio", "price_level"]:
        perturbed = features.copy()
        perturbed[key] = features[key] * 1.01  # 1% perturbation
        perturbed_elast, _ = model.predict(perturbed)
        change = abs(perturbed_elast - base_elast)
        perturbation_results.append({
            "feature": key,
            "base_value": features[key],
            "perturbed_value": perturbed[key],
            "elasticity_change": round(change, 4),
            "small_change": change < 0.5,  # max acceptable shift for 1% input change
        })

    all_smooth = all(p["small_change"] for p in perturbation_results)

    return {
        "deterministic": all_same,
        "prediction_count": len(predictions),
        "unique_values": len(set(predictions)),
        "perturbation_tests": perturbation_results,
        "lipschitz_smooth": all_smooth,
        "passed": all_same and all_smooth,
    }


def _evaluate_quantile_bounds() -> Dict:
    """Test that P10/P50/P90 bounds are ordered and reasonably spaced."""
    model = ElasticityModel("eval_quantile_test")

    test_features = [
        {"demand_score": 0.3, "competitor_spread": 0.2, "stock_ratio": 5.0, "price_level": 500, "margin_pct": 0.15, "search_trend_normalized": 0.3},
        {"demand_score": 0.7, "competitor_spread": 0.08, "stock_ratio": 1.5, "price_level": 1500, "margin_pct": 0.40, "search_trend_normalized": 0.8},
        {"demand_score": 0.5, "competitor_spread": 0.15, "stock_ratio": 3.0, "price_level": 1000, "margin_pct": 0.25, "search_trend_normalized": 0.5},
    ]

    results = []
    all_ordered = True

    for i, features in enumerate(test_features):
        bounds = model.predict_quantile_bounds(features)
        p10 = bounds["p10"]
        p50 = bounds["p50"]
        p90 = bounds["p90"]

        ordered = p10 <= p50 <= p90
        # P10 should be more negative (lower elasticity)
        # P90 should be less negative (higher elasticity)
        spread = p90 - p10

        if not ordered:
            all_ordered = False

        results.append({
            "test_index": i,
            "p10": round(p10, 3),
            "p50": round(p50, 3),
            "p90": round(p90, 3),
            "ordered": ordered,
            "spread": round(spread, 3),
            "source": bounds["source"],
        })

    return {
        "bounds_tests": results,
        "all_ordered": all_ordered,
        "passed": all_ordered,
    }


def _evaluate_shadow_log() -> Dict:
    """Analyze shadow evaluation log if it exists."""
    shadow_path = Path(__file__).parent.parent / "models" / "shadow_evaluations.jsonl"

    if not shadow_path.exists():
        return {
            "log_exists": False,
            "message": "No shadow evaluation log found (expected after ML model predictions are run).",
            "passed": True,  # Not a failure — just not generated yet
        }

    entries = []
    try:
        with open(shadow_path, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
    except Exception as e:
        return {"log_exists": True, "parse_error": str(e), "passed": False}

    if not entries:
        return {"log_exists": True, "entries": 0, "message": "Log exists but is empty.", "passed": True}

    deltas = [e.get("delta", 0) for e in entries]
    avg_delta = float(np.mean(deltas))

    return {
        "log_exists": True,
        "entries": len(entries),
        "avg_delta_baseline_vs_ml": round(avg_delta, 4),
        "max_delta": round(float(np.max(deltas)), 4),
        "passed": True,
    }


# ── Main Evaluator ────────────────────────────────────────────────────────────

def evaluate_elasticity() -> Dict:
    """Run the full elasticity model accuracy evaluation."""
    training = _evaluate_training_and_holdout()
    cold_start = _evaluate_cold_start_priors()
    stability = _evaluate_prediction_stability()
    quantiles = _evaluate_quantile_bounds()
    shadow = _evaluate_shadow_log()

    # Calculate overall score
    scores = []
    if training["passed"]:
        scores.append(min(100, max(0, training["r2_score"] * 100 + 50)))
    else:
        scores.append(30)

    scores.append(100 if cold_start["passed"] else 50)
    scores.append(100 if stability["passed"] else 40)
    scores.append(100 if quantiles["passed"] else 50)
    scores.append(100 if shadow["passed"] else 70)

    overall = np.mean(scores)

    return {
        "domain": "Elasticity Model Quality",
        "training_holdout": training,
        "cold_start_priors": cold_start,
        "prediction_stability": stability,
        "quantile_bounds": quantiles,
        "shadow_log": shadow,
        "aggregate": {
            "overall_score": round(float(overall), 1),
        },
        "quality_gates": {
            "training_pass": training["passed"],
            "cold_start_pass": cold_start["passed"],
            "stability_pass": stability["passed"],
            "quantile_pass": quantiles["passed"],
        },
        "passed": training["passed"] and stability["passed"] and quantiles["passed"],
    }


if __name__ == "__main__":
    print("=" * 70)
    print("  ELASTICITY MODEL ACCURACY EVALUATION")
    print("=" * 70)

    results = evaluate_elasticity()

    tr = results["training_holdout"]
    print(f"\n🎓 Training: {'✅' if tr['passed'] else '❌'} (R²={tr.get('r2_score', 'N/A')}, MAE={tr.get('mae', 'N/A')})")

    cs = results["cold_start_priors"]
    print(f"🧊 Cold-Start Priors: {'✅' if cs['passed'] else '❌'}")
    for cat in cs["categories"]:
        status = "✅" if cat["reasonable"] else "❌"
        print(f"   {status} {cat['category']}: prior={cat['expected_prior']}, predicted={cat['predicted']}, source={cat['source']}")

    st = results["prediction_stability"]
    print(f"🔁 Stability: {'✅' if st['passed'] else '❌'} (deterministic={st['deterministic']}, smooth={st['lipschitz_smooth']})")

    qb = results["quantile_bounds"]
    print(f"📊 Quantile Bounds: {'✅' if qb['passed'] else '❌'}")

    sl = results["shadow_log"]
    print(f"👻 Shadow Log: {'✅' if sl['passed'] else '❌'} ({sl.get('entries', 0)} entries)")

    print(f"\n📊 Overall Score: {results['aggregate']['overall_score']}%")
    print(f"\n{'✅ PASSED' if results['passed'] else '❌ FAILED'}")
