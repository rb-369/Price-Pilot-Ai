import pytest
from services.forecasting import forecast_demand

def test_forecast_demand_short_history():
    # If history is too short, it should fallback to baseline
    history = [{"score": 0.5}] * 2
    res = forecast_demand(history, forecast_days=7)
    assert res["modelUsed"] == "baseline"
    assert len(res["forecastValues"]) == 7
    assert res["predictedDemand"] > 0

def test_forecast_demand_valid_data():
    # Provide enough data to use an actual ML model (HoltWinters or Prophet)
    history = []
    for i in range(14):
        history.append({
            "timestamp": f"2023-01-{i+1:02d}T00:00:00Z",
            "score": 0.5 + (i * 0.02) # rising trend
        })
        
    res = forecast_demand(history, forecast_days=7)
    assert res["modelUsed"] in ["prophet", "holt_winters", "moving_average"]
    assert len(res["forecastValues"]) == 7
    assert res["trendDirection"] == "rising"

