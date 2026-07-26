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


def test_optimize_price_no_competitors_returns_error(client, mock_product, mock_demand_signals, monkeypatch):
    """When no competitors are provided and no API key is set, return an error message, not mock data."""
    monkeypatch.delenv("RAINFOREST_API_KEY", raising=False)
    monkeypatch.delenv("SERPAPI_API_KEY", raising=False)
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

def test_scrape_search_endpoint_with_asin(client, monkeypatch):
    """Test that the scraper search endpoint accepts the asin parameter."""
    # Mock the underlying fetch_product_by_asin function to avoid hitting the real API
    async def mock_fetch_product(*args, **kwargs):
        return {
            "platform": "Amazon",
            "productName": "Mocked ASIN Product",
            "url": "https://amazon.in/dp/B073JYC4XM",
            "asin": "B073JYC4XM",
            "price": 999.0,
            "inStock": True,
            "timestamp": "2026-01-01T00:00:00Z",
            "source": "rainforest_api"
        }
    
    # We must patch RAINFOREST_API_KEY so the route doesn't fail with 503
    monkeypatch.setenv("RAINFOREST_API_KEY", "test-key-mock")
    
    import services.rainforest
    monkeypatch.setattr(services.rainforest, "RAINFOREST_API_KEY", "test-key-mock")
    monkeypatch.setattr(services.rainforest, "fetch_product_by_asin", mock_fetch_product)
    
    # Also mock flipkart scraper to avoid real requests
    async def mock_flipkart(*args, **kwargs):
        return []
    
    import services.flipkart_scraper
    monkeypatch.setattr(services.flipkart_scraper, "scrape_flipkart_prices", mock_flipkart)

    payload = {
        "keyword": "sunscreen",
        "amazonDomain": "amazon.in",
        "asin": "B073JYC4XM"
    }

    response = client.post("/api/scrape/search", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "competitors" in data
    assert len(data["competitors"]) > 0
    assert data["competitors"][0]["asin"] == "B073JYC4XM"

