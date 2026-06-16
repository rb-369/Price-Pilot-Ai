from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.product_gen import generate_product_copy

router = APIRouter()

class GenerateRequest(BaseModel):
    product_name: str
    category: str = ""

@router.post("/generate-description")
async def generate_description(request: GenerateRequest):
    try:
        copy = await generate_product_copy(request.product_name, request.category)
        return copy
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
