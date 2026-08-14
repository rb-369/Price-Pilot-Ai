import pytest
from services.simulator import run_predictive_simulation


def test_predictive_simulation_basic():
    product = {
        "name": "Wireless Mouse",
        "sku": "MOUSE-100",
        "currentPrice": 100.0,
        "baseCost": 50.0,
        "stockLevel": 150,
        "reorderThreshold": 20,
        "salesVelocity": {"avgHourlySalesRate": 0.5}
    }
    competitors = [
        {"name": "Comp A", "price": 95.0},
        {"name": "Comp B", "price": 105.0}
    ]
    demand_signals = [
        {"compositeDemandScore": 0.65, "searchTrendScore": 75}
    ]

    sim = run_predictive_simulation(
        product=product,
        competitors=competitors,
        demand_signals=demand_signals,
        target_price=110.0,
        cogs=50.0,
        competitor_strategy="neutral",
        demand_multiplier=1.0,
        time_horizon_days=30
    )

    assert sim["product"]["name"] == "Wireless Mouse"
    assert sim["simulationParams"]["targetPrice"] == 110.0
    assert sim["baseline"]["price"] == 100.0
    assert sim["simulated"]["price"] == 110.0
    assert sim["simulated"]["predictedVolume"] > 0
    assert sim["simulated"]["predictedRevenue"] > 0
    assert sim["simulated"]["predictedProfit"] > 0
    assert "confidenceBounds" in sim["simulated"]
    assert len(sim["sensitivityCurve"]) == 25
    assert sim["optimalPricePoint"]["price"] > 0


def test_preset_scenarios():
    product = {
        "name": "Headphones",
        "sku": "HEAD-01",
        "currentPrice": 200.0,
        "baseCost": 100.0,
        "stockLevel": 80,
    }
    sim = run_predictive_simulation(
        product=product,
        competitors=[],
        demand_signals=[],
        target_price=200.0,
        cogs=100.0
    )
    assert "maximize_margin" in sim["presets"]
    assert "market_growth" in sim["presets"]
    assert "inflation_passthrough" in sim["presets"]
    assert "defend_undercut" in sim["presets"]
