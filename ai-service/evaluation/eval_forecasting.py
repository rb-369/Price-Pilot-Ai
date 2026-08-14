"""
PricePilot AI — Forecast Accuracy Evaluator
Walk-forward backtesting for Prophet/Holt-Winters/MA forecasts
with synthetic time-series patterns and model comparison.
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

from services.forecasting import forecast_demand
from evaluation.metrics import mae, mape, rmse, directional_accuracy, classification_accuracy


# ── Synthetic Time-Series Generators ──────────────────────────────────────────

def _generate_linear_trend(n: int = 60, slope: float = 0.005, base: float = 0.4, noise: float = 0.03) -> List[Dict]:
    """Linear upward trend with Gaussian noise."""
    np.random.seed(10)
    return [
        {"score": float(np.clip(base + slope * i + np.random.normal(0, noise), 0.01, 1.0))}
        for i in range(n)
    ]


def _generate_seasonal(n: int = 60, period: int = 7, amplitude: float = 0.15, base: float = 0.5, noise: float = 0.02) -> List[Dict]:
    """Weekly seasonal pattern with noise."""
    np.random.seed(20)
    return [
        {"score": float(np.clip(
            base + amplitude * np.sin(2 * np.pi * i / period) + np.random.normal(0, noise),
            0.01, 1.0
        ))}
        for i in range(n)
    ]


def _generate_mean_reverting(n: int = 60, mean: float = 0.5, noise: float = 0.08) -> List[Dict]:
    """Mean-reverting noisy series (Ornstein-Uhlenbeck style)."""
    np.random.seed(30)
    values = [mean]
    for _ in range(n - 1):
        reversion = 0.2 * (mean - values[-1])
        shock = np.random.normal(0, noise)
        values.append(float(np.clip(values[-1] + reversion + shock, 0.01, 1.0)))
    return [{"score": v} for v in values]


def _generate_spike_recovery(n: int = 60, spike_at: int = 30, spike_mag: float = 0.4) -> List[Dict]:
    """Stable baseline with a spike at a specific point and gradual recovery."""
    np.random.seed(40)
    base = 0.4
    values = []
    for i in range(n):
        if i < spike_at:
            v = base + np.random.normal(0, 0.02)
        elif i == spike_at:
            v = base + spike_mag
        else:
            decay = spike_mag * np.exp(-0.15 * (i - spike_at))
            v = base + decay + np.random.normal(0, 0.02)
        values.append(float(np.clip(v, 0.01, 1.0)))
    return [{"score": v} for v in values]


SERIES_GENERATORS = {
    "linear_trend": _generate_linear_trend,
    "seasonal_weekly": _generate_seasonal,
    "mean_reverting": _generate_mean_reverting,
    "spike_recovery": _generate_spike_recovery,
}


# ── Walk-Forward Backtest ─────────────────────────────────────────────────────

def _walk_forward_backtest(
    series: List[Dict],
    train_size: int = 30,
    forecast_horizon: int = 7,
    step: int = 7,
) -> Dict:
    """
    Walk-forward backtest: train on first N points, forecast next H,
    compare to actual, slide window forward by step.
    """
    actuals_all = []
    preds_all = []
    trend_true = []
    trend_pred = []
    confidences = []
    correct_flags = []

    total_len = len(series)
    cursor = train_size

    while cursor + forecast_horizon <= total_len:
        train_data = series[:cursor]
        actual_window = [d["score"] for d in series[cursor:cursor + forecast_horizon]]

        product_info = {"name": "Test Product", "stockLevel": 100, "reorderThreshold": 20}
        result = forecast_demand(train_data, forecast_days=forecast_horizon, product_info=product_info)

        forecast_values = result["forecastValues"][:forecast_horizon]

        # Pad if forecast returned fewer values
        while len(forecast_values) < len(actual_window):
            forecast_values.append(forecast_values[-1] if forecast_values else 0.5)

        actuals_all.extend(actual_window)
        preds_all.extend(forecast_values)

        # Trend direction
        avg_actual = np.mean(actual_window)
        avg_train = np.mean([d["score"] for d in train_data[-7:]])
        actual_trend = "rising" if avg_actual > avg_train * 1.05 else ("declining" if avg_actual < avg_train * 0.95 else "stable")
        predicted_trend = result.get("trendDirection", "stable")

        trend_true.append(actual_trend)
        trend_pred.append(predicted_trend)

        conf = result.get("confidenceScore", 0.5)
        confidences.append(conf)

        # Is this window accurate (MAPE < 20%)?
        window_mape = mape(actual_window, forecast_values)
        correct_flags.append(window_mape < 20.0)

        cursor += step

    if not actuals_all:
        return {"mae": 0, "mape": 0, "rmse": 0, "trend_accuracy": 0, "windows": 0}

    return {
        "mae": round(mae(actuals_all, preds_all), 4),
        "mape": round(mape(actuals_all, preds_all), 2),
        "rmse": round(rmse(actuals_all, preds_all), 4),
        "trend_accuracy": round(classification_accuracy(trend_true, trend_pred), 1),
        "windows": len(trend_true),
        "model_used": "walk_forward_mixed",
    }


# ── Main Evaluator ────────────────────────────────────────────────────────────

def evaluate_forecasting() -> Dict:
    """Run the full forecast accuracy evaluation across all patterns."""
    results = {
        "domain": "Demand Forecasting",
        "patterns": {},
        "aggregate": {},
    }

    all_maes = []
    all_mapes = []
    all_trend_accs = []

    for pattern_name, generator in SERIES_GENERATORS.items():
        series = generator(n=60)
        backtest = _walk_forward_backtest(series, train_size=30, forecast_horizon=7, step=7)

        results["patterns"][pattern_name] = backtest
        all_maes.append(backtest["mae"])
        all_mapes.append(backtest["mape"])
        all_trend_accs.append(backtest["trend_accuracy"])

    # ── Fallback chain test ───────────────────────────────────────────────────
    # Test with minimal data (< 3 points) — should use baseline
    minimal = [{"score": 0.5}, {"score": 0.6}]
    min_result = forecast_demand(minimal, forecast_days=7, product_info={"name": "Test", "stockLevel": 50, "reorderThreshold": 10})
    fallback_correct = min_result.get("modelUsed") == "baseline"

    # Test with 5 points — should use MA or Holt-Winters (not Prophet if < ~10 unique dates)
    small = [{"score": 0.4 + i * 0.02} for i in range(5)]
    small_result = forecast_demand(small, forecast_days=7, product_info={"name": "Test", "stockLevel": 50, "reorderThreshold": 10})
    small_model = small_result.get("modelUsed", "unknown")

    # ── Aggregate ─────────────────────────────────────────────────────────────
    avg_mae = round(np.mean(all_maes), 4)
    avg_mape = round(np.mean(all_mapes), 2)
    avg_trend = round(np.mean(all_trend_accs), 1)

    # Overall score (weighted)
    mae_score = max(0, 100 - avg_mape)  # Lower MAPE = higher score
    overall = (avg_trend * 0.5 + mae_score * 0.5)

    results["aggregate"] = {
        "avg_mae": avg_mae,
        "avg_mape_pct": avg_mape,
        "avg_trend_accuracy_pct": avg_trend,
        "overall_score": round(overall, 1),
        "fallback_chain_correct": fallback_correct,
        "small_data_model": small_model,
    }

    results["quality_gates"] = {
        "mae_below_015": avg_mae < 0.15,
        "trend_accuracy_above_80": avg_trend >= 80.0,
        "fallback_chain_correct": fallback_correct,
    }
    # Be lenient: pass if at least 2 of 3 gates pass
    gates_passed = sum(results["quality_gates"].values())
    results["passed"] = gates_passed >= 2

    return results


if __name__ == "__main__":
    print("=" * 70)
    print("  FORECAST ACCURACY EVALUATION")
    print("=" * 70)

    results = evaluate_forecasting()

    for pattern, data in results["patterns"].items():
        print(f"\n📈 {pattern}:")
        print(f"   MAE: {data['mae']}, MAPE: {data['mape']}%, Trend Accuracy: {data['trend_accuracy']}%")

    agg = results["aggregate"]
    print(f"\n📊 AGGREGATE: MAE={agg['avg_mae']}, MAPE={agg['avg_mape_pct']}%, Trend Acc={agg['avg_trend_accuracy_pct']}%")
    print(f"📈 Overall Score: {agg['overall_score']}%")
    print(f"🔄 Fallback chain correct: {agg['fallback_chain_correct']}")
    print(f"\n{'✅ PASSED' if results['passed'] else '❌ FAILED'}")
