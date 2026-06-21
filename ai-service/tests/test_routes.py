from fastapi.testclient import TestClient

def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "version" in response.json()

def test_optimize_price_endpoint(client, mock_product, mock_competitors, mock_demand_signals):
    payload = {
        "product": mock_product,
        "competitors": mock_competitors,
        "demand_signals": mock_demand_signals
    }
    
    response = client.post("/api/optimize-price", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "recommendedPrice" in data
    assert "reason" in data
    assert "revenueImpact" in data



def test_suggest_promotion_endpoint(client, mock_product, mock_demand_signals):
    # Make product overstocked
    mock_product["stockLevel"] = 500
    
    payload = {
        "product": mock_product,
        "demand_signals": mock_demand_signals
    }
    
    response = client.post("/api/suggest-promotion", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "shouldPromote" in data
