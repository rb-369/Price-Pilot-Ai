import pytest
from services.elasticity_model import ElasticityModel

def test_elasticity_model_fallback():
    model = ElasticityModel()
    model.model = None # Force it into an unloaded state to test the fallback mechanism
    
    # Assuming no model file is loaded, it should use heuristic fallback
    features = {
        "demand_score": 0.5,
        "stock_ratio": 3.0,
    }
    
    elasticity, source = model.predict(features)
    
    assert source == "heuristic"
    assert elasticity < 0 # Elasticity is usually negative

def test_elasticity_model_training():
    model = ElasticityModel()
    
    # Create mock training data (minimum 30 needed)
    training_data = []
    for i in range(40):
        training_data.append({
            "features": {
                "demand_score": 0.5 + (i * 0.01),
                "competitor_spread": 0.1,
                "stock_ratio": 3.0,
                "price_level": 1000,
                "margin_pct": 0.2,
                "search_trend_normalized": 0.5
            },
            "elasticity_observed": -1.5 - (i * 0.01) # Simple linear relation
        })
        
    result = model.train(training_data)
    
    assert result["status"] == "success"
    assert result["samples"] == 40
    assert "r2_mean" in result
    
    # Test prediction with trained model
    features = training_data[0]["features"]
    elasticity, source = model.predict(features)
    
    assert source == "ml_model"
    assert elasticity < 0

def test_insufficient_training_data():
    model = ElasticityModel()
    training_data = [{"features": {}, "elasticity_observed": -1.5}] * 5
    
    result = model.train(training_data)
    
    assert result["status"] == "insufficient_data"
