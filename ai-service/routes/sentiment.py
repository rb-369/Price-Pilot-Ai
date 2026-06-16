from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.sentiment import analyze_sentiment

router = APIRouter()

class SentimentRequest(BaseModel):
    product_name: str
    category: str
    feedback: str

@router.post("/analyze-sentiment")
async def get_sentiment(request: SentimentRequest):
    try:
        result = await analyze_sentiment(request.product_name, request.category, request.feedback)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
