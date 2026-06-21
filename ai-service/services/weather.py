"""
Weather Service
Fetches real weather data from OpenWeatherMap and computes a demand impact factor.
Category-aware: e.g., umbrellas get positive factor in rain, ACs in heatwaves.
"""
import os
import httpx
from typing import Optional
from datetime import datetime


OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather"

# Category → weather condition impact mapping
# Positive means weather BOOSTS demand, negative means it HURTS demand
CATEGORY_WEATHER_MAP = {
    "electronics": {"Rain": 0.1, "Thunderstorm": -0.2, "Clear": 0.05, "Snow": -0.1, "Extreme": -0.3},
    "clothing": {"Rain": -0.1, "Thunderstorm": -0.2, "Clear": 0.15, "Snow": 0.2, "Extreme": -0.2},
    "food": {"Rain": 0.1, "Thunderstorm": 0.15, "Clear": 0.0, "Snow": 0.2, "Extreme": 0.1},
    "outdoor": {"Rain": -0.3, "Thunderstorm": -0.4, "Clear": 0.3, "Snow": -0.2, "Extreme": -0.3},
    "home": {"Rain": 0.15, "Thunderstorm": 0.1, "Clear": -0.05, "Snow": 0.2, "Extreme": 0.1},
    "beauty": {"Rain": -0.05, "Thunderstorm": -0.1, "Clear": 0.1, "Snow": 0.0, "Extreme": -0.1},
    "general": {"Rain": 0.0, "Thunderstorm": -0.1, "Clear": 0.05, "Snow": 0.0, "Extreme": -0.15},
}

# Temperature thresholds for demand impact (Celsius)
TEMP_IMPACT = {
    "heatwave": {"threshold": 38, "categories": {"electronics": 0.15, "clothing": -0.1, "food": 0.1, "general": 0.05}},
    "cold_snap": {"threshold": 10, "categories": {"clothing": 0.2, "food": 0.15, "electronics": 0.05, "general": 0.05}},
}


async def get_weather_factor(city: str = "Mumbai", category: str = "general") -> dict:
    """
    Get weather-based demand impact factor for a product category.

    Args:
        city: City name (default: Mumbai for Indian e-commerce)
        category: Product category for weather impact calculation

    Returns:
        {"factor": float (-1 to 1), "source": str, "weather": str, "temp": float}
    """
    category = category.lower().strip()
    if category not in CATEGORY_WEATHER_MAP:
        category = "general"

    # ── Try real API ──────────────────────────────────────────────────────
    if OPENWEATHER_API_KEY:
        try:
            result = await _fetch_weather(city)
            if result:
                factor = _compute_factor(result, category)
                return {
                    "factor": round(factor, 3),
                    "source": "openweathermap",
                    "weather": result["condition"],
                    "temp": result["temp"],
                    "city": city,
                }
        except Exception as e:
            print(f"[Weather] OpenWeatherMap failed: {e}")

    # ── Fallback: simulated ───────────────────────────────────────────────
    factor = _simulate_weather_factor(city, category)
    return {
        "factor": round(factor, 3),
        "source": "simulated",
        "weather": "unknown",
        "temp": 0,
        "city": city,
    }


async def _fetch_weather(city: str) -> Optional[dict]:
    """Fetch current weather from OpenWeatherMap."""
    params = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(OPENWEATHER_BASE, params=params)
        response.raise_for_status()
        data = response.json()

    weather_list = data.get("weather", [])
    main_data = data.get("main", {})

    if not weather_list:
        return None

    condition = weather_list[0].get("main", "Clear")
    description = weather_list[0].get("description", "")
    temp = main_data.get("temp", 25)
    humidity = main_data.get("humidity", 50)

    return {
        "condition": condition,
        "description": description,
        "temp": temp,
        "humidity": humidity,
    }


def _compute_factor(weather_data: dict, category: str) -> float:
    """Compute demand impact factor from weather data."""
    condition = weather_data["condition"]
    temp = weather_data["temp"]

    # Base weather condition factor
    cat_map = CATEGORY_WEATHER_MAP.get(category, CATEGORY_WEATHER_MAP["general"])
    factor = cat_map.get(condition, 0.0)

    # Temperature extreme adjustments
    if temp >= TEMP_IMPACT["heatwave"]["threshold"]:
        temp_boost = TEMP_IMPACT["heatwave"]["categories"].get(category, 0.05)
        factor += temp_boost
    elif temp <= TEMP_IMPACT["cold_snap"]["threshold"]:
        temp_boost = TEMP_IMPACT["cold_snap"]["categories"].get(category, 0.05)
        factor += temp_boost

    # Clamp to valid range
    return max(-1.0, min(1.0, factor))


def _simulate_weather_factor(city: str, category: str) -> float:
    """Deterministic simulated weather factor."""
    day_of_year = datetime.utcnow().timetuple().tm_yday
    city_hash = sum(ord(c) for c in city)
    seed = (city_hash * 17 + day_of_year * 31) % 1000
    # Generate a value in -0.3 to 0.3 range
    raw = (seed / 1000) * 0.6 - 0.3
    return round(raw, 3)
