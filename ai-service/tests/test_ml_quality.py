import pytest
import numpy as np
from datetime import datetime, timedelta
from services.elasticity_model import ElasticityModel
from services.pricing import select_bandit_price_arm
from services.validator import validate_price_margin_guardrail

def test_walk_forward_temporal_split_training():
    """Verify elasticity model training with walk-forward chronological data split."""
    model = ElasticityModel("test_user_quality")
    
    # Generate 50 synthetic chronological feedback observations
    base_time = datetime(2026, 1, 1)
    synthetic_data = []
    for i in range(50):
        t = base_time + timedelta(days=i)
        synthetic_data.append({
            "timestamp": t.isoformat(),
            "features": {
                "demand_score": float(np.random.uniform(0.3, 0.9)),
                "competitor_spread": float(np.random.uniform(0.05, 0.25)),
                "stock_ratio": float(np.random.uniform(0.5, 4.0)),
                "price_level": float(np.random.uniform(500, 2000)),
                "margin_pct": float(np.random.uniform(0.15, 0.5)),
                "search_trend_normalized": float(np.random.uniform(0.2, 0.9)),
            },
            "elasticity_observed": float(-1.0 - (i % 5) * 0.2)
        })

    res = model.train(synthetic_data)
    assert res["status"] == "success"
    assert "r2_mean" in res
    assert "mae" in res
    assert res["samples"] == 50

def test_margin_guardrail_fuzzing():
    """Fuzz test 1,000 random inputs to assert zero margin breaches occur."""
    np.random.seed(42)
    breaches_unhandled = 0

    for _ in range(1000):
        cogs = float(np.random.uniform(50, 5000))
        min_margin = float(np.random.uniform(0.05, 0.35))
        # Generate candidate prices both above and below cost
        candidate_price = float(np.random.uniform(cogs * 0.5, cogs * 2.0))

        result = validate_price_margin_guardrail(candidate_price, cogs, min_margin)
        
        # Verify recommended price is NEVER below COGS * (1 + min_margin)
        min_allowed = np.ceil(cogs * (1.0 + min_margin))
        if result["recommendedPrice"] < min_allowed:
            breaches_unhandled += 1

    assert breaches_unhandled == 0, f"Found {breaches_unhandled} unhandled margin breaches during fuzzing!"

def test_thompson_sampling_bandit_simulation():
    """Simulate 500 steps of Thompson Sampling Multi-Armed Bandit selection."""
    candidate_prices = [500.0, 550.0, 600.0, 650.0]
    cogs = 350.0

    arm_stats = {
        "500.0": {"alpha": 10.0, "beta": 5.0},
        "550.0": {"alpha": 8.0, "beta": 7.0},
        "600.0": {"alpha": 15.0, "beta": 3.0},  # Highest conversion
        "650.0": {"alpha": 4.0, "beta": 12.0},
    }

    selected_counts = {str(p): 0 for p in candidate_prices}
    for _ in range(500):
        res = select_bandit_price_arm(candidate_prices, cogs, arm_stats, exploration_floor=0.10)
        selected_p = str(res["selectedPrice"])
        if selected_p in selected_counts:
            selected_counts[selected_p] += 1

    # High-performing arm (600.0) should be selected more often than low-performing arm (650.0)
    assert selected_counts["600.0"] > selected_counts["650.0"]
