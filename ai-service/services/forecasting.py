"""
Demand Forecasting Service — Upgraded
Uses Facebook Prophet for time-series forecasting with:
  - Trend decomposition
  - Weekly + yearly seasonality
  - Graceful fallback to Holt-Winters if Prophet unavailable
"""
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta


def _build_prophet_dataframe(demand_history: List[Dict]):
    """
    Convert demand history list into a Prophet-compatible DataFrame.
    Prophet requires columns: ds (datetime), y (value).
    """
    import pandas as pd

    rows = []
    for i, point in enumerate(demand_history):
        # Use provided timestamp or generate synthetic daily dates going backward
        ts = point.get("timestamp")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                dt = datetime.utcnow() - timedelta(days=len(demand_history) - i)
        else:
            dt = datetime.utcnow() - timedelta(days=len(demand_history) - i)

        score = float(point.get("score", 0.5))
        score = max(0.01, min(1.0, score))
        rows.append({"ds": dt, "y": score})

    df = pd.DataFrame(rows).sort_values("ds").reset_index(drop=True)

    # Drop duplicate dates — Prophet cannot handle them
    df = df.drop_duplicates(subset="ds")

    return df


def _forecast_with_prophet(scores_df, forecast_days: int) -> List[float]:
    """
    Run Facebook Prophet on the prepared DataFrame.
    Returns a list of forecasted demand scores (0–1).
    """
    from prophet import Prophet

    n = len(scores_df)

    model = Prophet(
        # Trend flexibility — higher = follows data more closely
        changepoint_prior_scale=0.05 if n < 30 else 0.1,
        # Seasonality
        weekly_seasonality=n >= 14,     # Need 2+ weeks of data
        yearly_seasonality=n >= 180,    # Need 6+ months
        daily_seasonality=False,
        seasonality_mode="multiplicative" if n >= 30 else "additive",
        # Uncertainty — tighter for small datasets
        interval_width=0.80,
        # Suppress verbose logging
        stan_backend="CMDSTANPY",
    )

    # Silence Prophet's output
    import logging
    logging.getLogger("prophet").setLevel(logging.WARNING)
    logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

    model.fit(scores_df)

    future = model.make_future_dataframe(periods=forecast_days, freq="D")
    forecast = model.predict(future)

    # Extract only the future forecast rows
    future_forecast = forecast.tail(forecast_days)["yhat"].tolist()

    # Clamp to valid range
    return [max(0.0, min(1.0, v)) for v in future_forecast]


def _forecast_with_holtwinters(scores: np.ndarray, forecast_days: int) -> List[float]:
    """
    Fallback: Holt-Winters exponential smoothing from statsmodels.
    """
    from statsmodels.tsa.holtwinters import SimpleExpSmoothing, ExponentialSmoothing

    if len(scores) >= 7:
        model = ExponentialSmoothing(
            scores,
            trend="add",
            seasonal=None,
            initialization_method="estimated",
        )
        fitted = model.fit(optimized=True)
    else:
        model = SimpleExpSmoothing(scores, initialization_method="estimated")
        fitted = model.fit(smoothing_level=0.3, optimized=False)

    forecast = fitted.forecast(forecast_days)
    return np.clip(forecast, 0, 1).tolist()


def _forecast_moving_average(scores: np.ndarray, forecast_days: int) -> List[float]:
    """
    Last-resort fallback: simple moving average with linear trend extrapolation.
    """
    window = min(7, len(scores))
    avg = float(np.mean(scores[-window:]))
    trend = float(np.mean(np.diff(scores[-window:]))) if len(scores) > 1 else 0

    return [max(0.0, min(1.0, avg + trend * i)) for i in range(forecast_days)]


def forecast_demand(
    demand_history: List[Dict],
    forecast_days: int = 30,
    product_info: Optional[Dict] = None,
) -> Dict:
    """
    Forecast future demand using the best available model:
      1. Prophet (preferred — handles seasonality, holidays, trend breaks)
      2. Holt-Winters (fallback if Prophet not installed)
      3. Moving average (last resort)

    Args:
        demand_history: List of {score: float, timestamp?: str}
        forecast_days: How many days ahead to forecast
        product_info: {name, stockLevel, reorderThreshold}

    Returns:
        Dict with forecast values, trend analysis, and a human-readable reason
    """
    stock = product_info.get("stockLevel", 100) if product_info else 100
    reorder = product_info.get("reorderThreshold", 20) if product_info else 20
    product_name = product_info.get("name", "this product") if product_info else "this product"

    # ── Not enough data ──────────────────────────────────────────────────────
    if not demand_history or len(demand_history) < 3:
        base_demand = stock
        return {
            "predictedDemand": int(base_demand * 0.7),
            "recommendedStockIncrease": max(0, int(base_demand * 0.3)),
            "forecastValues": [round(base_demand * 0.7 / forecast_days, 4)] * forecast_days,
            "trendDirection": "unknown",
            "confidenceScore": 0.3,
            "modelUsed": "baseline",
            "reason": "Insufficient historical data (min 3 points required). Forecast based on current stock levels.",
        }

    scores_array = np.array(
        [max(0.01, min(1.0, float(d.get("score", 0.5)))) for d in demand_history],
        dtype=float,
    )

    # ── Run forecast ─────────────────────────────────────────────────────────
    forecast_values: List[float]
    model_used: str

    try:
        import pandas as pd
        df = _build_prophet_dataframe(demand_history)

        if len(df) < 3:
            raise ValueError("Too few unique dates for Prophet.")

        forecast_values = _forecast_with_prophet(df, forecast_days)
        model_used = "prophet"

    except ImportError:
        # Prophet not installed
        try:
            forecast_values = _forecast_with_holtwinters(scores_array, forecast_days)
            model_used = "holt_winters"
        except Exception:
            forecast_values = _forecast_moving_average(scores_array, forecast_days)
            model_used = "moving_average"

    except Exception as e:
        print(f"[Forecasting] Prophet failed ({e}), falling back to Holt-Winters.")
        try:
            forecast_values = _forecast_with_holtwinters(scores_array, forecast_days)
            model_used = "holt_winters"
        except Exception:
            forecast_values = _forecast_moving_average(scores_array, forecast_days)
            model_used = "moving_average"

    # ── Trend analysis ───────────────────────────────────────────────────────
    avg_forecast = float(np.mean(forecast_values))
    avg_recent = float(np.mean(scores_array[-7:])) if len(scores_array) >= 7 else float(np.mean(scores_array))

    pct_change = (avg_forecast - avg_recent) / max(avg_recent, 0.01) * 100

    if pct_change > 5:
        trend_direction = "rising"
    elif pct_change < -5:
        trend_direction = "declining"
    else:
        trend_direction = "stable"

    # Volatility — std dev of recent scores
    volatility = float(np.std(scores_array[-14:])) if len(scores_array) >= 14 else float(np.std(scores_array))

    # ── Unit demand estimate ─────────────────────────────────────────────────
    # Scale normalized score (0–1) to unit estimate using stock as reference
    predicted_demand = int(avg_forecast * stock * 1.5)
    recommended_increase = max(0, predicted_demand - stock + reorder)

    # ── Confidence score ─────────────────────────────────────────────────────
    n = len(demand_history)
    base_confidence = {
        "prophet": 0.65,
        "holt_winters": 0.55,
        "moving_average": 0.40,
        "baseline": 0.30,
    }.get(model_used, 0.45)

    # More data = more confidence; high volatility = less
    data_bonus = min(0.25, n * 0.005)
    volatility_penalty = min(0.15, volatility * 0.5)
    confidence = round(min(0.95, base_confidence + data_bonus - volatility_penalty), 2)

    # ── Human-readable reason ─────────────────────────────────────────────────
    model_label = {
        "prophet": "Prophet (seasonality-aware)",
        "holt_winters": "Holt-Winters exponential smoothing",
        "moving_average": "moving average",
        "baseline": "stock-based baseline",
    }.get(model_used, model_used)

    if trend_direction == "rising":
        reason = (
            f"Demand for {product_name} is projected to rise {pct_change:.1f}% over the next {forecast_days} days "
            f"(model: {model_label}). Expected sales: {predicted_demand} units. "
            f"Recommend increasing stock by {recommended_increase} units."
        )
    elif trend_direction == "declining":
        reason = (
            f"Demand for {product_name} is softening ({pct_change:.1f}% projected change, model: {model_label}). "
            f"Expected sales: {predicted_demand} units over {forecast_days} days. "
            f"Consider reducing reorder quantities to avoid overstock."
        )
    else:
        reason = (
            f"Demand for {product_name} is stable (model: {model_label}). "
            f"Expected sales: {predicted_demand} units over {forecast_days} days. "
            f"Maintain current inventory levels."
        )

    if volatility > 0.15:
        reason += f" Note: high demand volatility (σ={volatility:.2f}) — treat forecast with caution."

    return {
        "predictedDemand": predicted_demand,
        "recommendedStockIncrease": recommended_increase,
        "forecastValues": [round(v, 4) for v in forecast_values],
        "trendDirection": trend_direction,
        "trendChangePct": round(pct_change, 1),
        "volatility": round(volatility, 3),
        "confidenceScore": confidence,
        "modelUsed": model_used,
        "reason": reason,
    }