"""
Demand Forecasting Service
Uses exponential smoothing (Holt-Winters) from statsmodels
"""
import numpy as np
from typing import List, Dict, Optional


def forecast_demand(
    demand_history: List[Dict],
    forecast_days: int = 30,
    product_info: Optional[Dict] = None,
) -> Dict:
    """
    Forecast future demand based on historical demand signals.
    Uses simple exponential smoothing for short series,
    Holt's method for longer series.
    """
    if not demand_history or len(demand_history) < 3:
        # Not enough data — return baseline estimate
        base_demand = product_info.get("stockLevel", 50) if product_info else 50
        return {
            "predictedDemand": int(base_demand * 0.7),
            "recommendedStockIncrease": max(0, int(base_demand * 0.3)),
            "forecastValues": [base_demand * 0.7 / forecast_days] * forecast_days,
            "confidenceScore": 0.4,
            "reason": "Limited historical data — forecast based on current stock levels.",
        }

    # Extract demand scores
    scores = [d.get("score", 0.5) for d in demand_history]
    scores = np.array(scores, dtype=float)

    # Clamp to valid range
    scores = np.clip(scores, 0.01, 1.0)

    try:
        from statsmodels.tsa.holtwinters import SimpleExpSmoothing, ExponentialSmoothing

        if len(scores) >= 7:
            # Use Holt's linear trend method
            model = ExponentialSmoothing(
                scores,
                trend="add",
                seasonal=None,
                initialization_method="estimated",
            )
            fitted = model.fit(optimized=True)
            forecast_values = fitted.forecast(forecast_days)
        else:
            # Simple exponential smoothing for very short series
            model = SimpleExpSmoothing(scores, initialization_method="estimated")
            fitted = model.fit(smoothing_level=0.3, optimized=False)
            forecast_values = fitted.forecast(forecast_days)

        forecast_values = np.clip(forecast_values, 0, 1).tolist()
    except Exception:
        # Fallback: use moving average
        window = min(7, len(scores))
        avg = float(np.mean(scores[-window:]))
        trend = float(np.mean(np.diff(scores[-window:]))) if len(scores) > 1 else 0
        forecast_values = [
            max(0, min(1, avg + trend * i)) for i in range(forecast_days)
        ]

    # Calculate metrics
    avg_forecast = float(np.mean(forecast_values))
    avg_recent = float(np.mean(scores[-7:])) if len(scores) >= 7 else float(np.mean(scores))
    trend_direction = "rising" if avg_forecast > avg_recent else "declining" if avg_forecast < avg_recent * 0.95 else "stable"

    # Estimate unit demand (scale score to units)
    stock = product_info.get("stockLevel", 100) if product_info else 100
    reorder = product_info.get("reorderThreshold", 20) if product_info else 20
    predicted_demand = int(avg_forecast * stock * 1.5)
    recommended_increase = max(0, predicted_demand - stock + reorder)

    # Confidence based on data quality
    confidence = min(0.95, 0.5 + len(demand_history) * 0.01 + (0.1 if len(demand_history) >= 14 else 0))

    product_name = product_info.get("name", "this product") if product_info else "this product"

    if trend_direction == "rising":
        reason = f"Demand for {product_name} is trending upward ({(avg_forecast/max(avg_recent, 0.01)*100 - 100):.1f}% increase projected). Increase stock by {recommended_increase} units to meet expected demand of {predicted_demand} units over {forecast_days} days."
    elif trend_direction == "declining":
        reason = f"Demand for {product_name} is softening. Expected to sell {predicted_demand} units over {forecast_days} days. Consider reducing reorder quantities."
    else:
        reason = f"Demand for {product_name} is stable. Expected to sell {predicted_demand} units over {forecast_days} days. Maintain current inventory levels."

    return {
        "predictedDemand": predicted_demand,
        "recommendedStockIncrease": recommended_increase,
        "forecastValues": [round(v, 4) for v in forecast_values],
        "trendDirection": trend_direction,
        "confidenceScore": round(confidence, 2),
        "reason": reason,
    }
