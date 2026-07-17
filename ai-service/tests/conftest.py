import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_product():
    return {
        "name": "Test Wireless Earbuds",
        "category": "Electronics",
        "currentPrice": 2999,
        "baseCost": 1500,
        "stockLevel": 150,
        "reorderThreshold": 50,
        "minMargin": 0.15
    }

@pytest.fixture
def mock_competitors():
    return [
        {"name": "Comp A", "price": 3100, "inStock": True, "rating": 4.5},
        {"name": "Comp B", "price": 2800, "inStock": True, "rating": 4.2},
        {"name": "Comp C", "price": 2950, "inStock": False, "rating": 4.0},
    ]

@pytest.fixture
def mock_demand_signals():
    return [
        {"searchTrendScore": 75, "socialSentimentScore": 0.4, "eventFactor": 0.2, "compositeDemandScore": 0.8},
        {"searchTrendScore": 70, "socialSentimentScore": 0.3, "eventFactor": 0.2, "compositeDemandScore": 0.75},
        {"searchTrendScore": 65, "socialSentimentScore": 0.2, "eventFactor": 0.0, "compositeDemandScore": 0.65},
        {"searchTrendScore": 60, "socialSentimentScore": 0.1, "eventFactor": 0.0, "compositeDemandScore": 0.6},
    ]
