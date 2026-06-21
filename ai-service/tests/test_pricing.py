import pytest
from services.pricing import optimize_price, suggest_promotion

def test_optimize_price_increases_when_underpriced(mock_product, mock_competitors, mock_demand_signals):
    # Set current price significantly lower than competitors (competitor avg is ~2900-3000)
    mock_product["currentPrice"] = 2000
    
    result = optimize_price(mock_product, mock_competitors, mock_demand_signals)
    
    assert "recommendedPrice" in result
    assert result["recommendedPrice"] > 2000
    assert result["factors"]["competitorFactor"] > 0
    assert "Increase" in result["reason"]

def test_optimize_price_decreases_when_overpriced(mock_product, mock_competitors, mock_demand_signals):
    # Set current price significantly higher than competitors
    mock_product["currentPrice"] = 4000
    
    result = optimize_price(mock_product, mock_competitors, mock_demand_signals)
    
    assert "recommendedPrice" in result
    assert result["recommendedPrice"] < 4000
    assert result["factors"]["competitorFactor"] < 0
    assert "Decrease" in result["reason"]

def test_optimize_price_respects_min_margin(mock_product, mock_competitors, mock_demand_signals):
    # Set current price low and base cost high, meaning any decrease goes below margin
    mock_product["currentPrice"] = 1600
    mock_product["baseCost"] = 1500
    mock_product["minMargin"] = 0.15 # Minimum price = 1500 * 1.15 = 1725
    
    # Competitors are low, pushing price down
    low_competitors = [{"name": "Comp Low", "price": 1000, "inStock": True}]
    
    result = optimize_price(mock_product, low_competitors, mock_demand_signals)
    
    # Price should increase to meet minimum margin
    assert result["recommendedPrice"] >= 1725

def test_suggest_promotion_when_overstocked(mock_product, mock_demand_signals):
    mock_product["stockLevel"] = 500 # 10x reorder threshold
    
    # Weak demand
    weak_demand = [{"compositeDemandScore": 0.2}] * 7
    
    result = suggest_promotion(mock_product, weak_demand)
    
    assert result["shouldPromote"] is True
    assert result["discountPercentage"] >= 5
    assert "clear excess inventory" in result["reason"]

def test_no_promotion_when_stock_is_normal(mock_product, mock_demand_signals):
    mock_product["stockLevel"] = 60 # near reorder threshold
    
    result = suggest_promotion(mock_product, mock_demand_signals)
    
    assert result["shouldPromote"] is False
    assert "Stock levels do not warrant a promotion" in result["reason"]
