import pytest
from services.data_pipeline import detect_event_factor

def test_detect_event_factor():
    import datetime
    from unittest.mock import patch
    
    # Mock date to Diwali (Nov 10)
    mock_now = datetime.datetime(2023, 11, 10)
    
    with patch('services.data_pipeline.datetime') as mock_datetime:
        mock_datetime.utcnow.return_value = mock_now
        
        result = detect_event_factor()
        
        assert result["factor"] > 0
        assert result["event"] == "Diwali Sales"
        assert result["source"] == "calendar"

def test_detect_no_event_factor():
    import datetime
    from unittest.mock import patch
    
    # Mock date to non-event day (May 15)
    mock_now = datetime.datetime(2023, 5, 15)
    
    with patch('services.data_pipeline.datetime') as mock_datetime:
        mock_datetime.utcnow.return_value = mock_now
        
        result = detect_event_factor()
        
        assert result["factor"] == 0.0
        assert result["event"] is None

@pytest.mark.asyncio
async def test_collect_real_demand_signal():
    from services.data_pipeline import collect_real_demand_signal
    from unittest.mock import patch
    
    with patch('services.data_pipeline.get_google_trends_score') as mock_trends, \
         patch('services.data_pipeline.get_weather_factor') as mock_weather, \
         patch('services.data_pipeline.get_news_sentiment') as mock_sentiment:
         
        # Mock responses
        mock_trends.return_value = {"score": 80, "source": "mocked"}
        mock_weather.return_value = {"factor": 0.1, "source": "mocked"}
        mock_sentiment.return_value = {"score": 0.5, "source": "mocked"}
        
        result = await collect_real_demand_signal("Test Product", "general", "Mumbai")
        
        assert result["searchTrendScore"] == 80
        assert result["weatherFactor"] == 0.1
        assert result["socialSentimentScore"] == 0.5
        assert "metadata" in result
