from fastapi.testclient import TestClient

def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "version" in response.json()

def test_optimize_price_endpoint(client, mock_product, mock_competitors, mock_demand_signals):
    payload = {
        "product": mock_product,
        "competitorPrices": mock_competitors,
        "demandSignals": mock_demand_signals
    }
    
    response = client.post("/api/optimize-price", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "recommendedPrice" in data
    assert "reason" in data
    assert "revenueImpact" in data


def test_optimize_price_no_competitors_returns_error(client, mock_product, mock_demand_signals):
    """When no competitors are provided and no API key is set, return an error message, not mock data."""
    payload = {
        "product": mock_product,
        "competitorPrices": [],
        "demandSignals": mock_demand_signals
    }

    response = client.post("/api/optimize-price", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data.get("error") is True
    assert "message" in data
    assert "Failed to fetch" in data["message"]


def test_suggest_promotion_endpoint(client, mock_product, mock_demand_signals):
    # Make product overstocked
    mock_product["stockLevel"] = 500
    
    payload = {
        "product": mock_product,
        "demandSignals": mock_demand_signals
    }
    
    response = client.post("/api/suggest-promotion", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "shouldPromote" in data
