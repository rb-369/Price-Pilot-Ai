"""
Data Pipeline Route
Exposes the real data pipeline to the Node.js backend.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

from services.data_pipeline import collect_real_demand_signal, collect_bulk_signals

router = APIRouter()


class CollectSignalRequest(BaseModel):
    product_name: str
    category: Optional[str] = "general"
    city: Optional[str] = "Mumbai"


class BulkCollectRequest(BaseModel):
    products: List[dict]  # [{"name": str, "category": str}]
    city: Optional[str] = "Mumbai"


@router.post("/collect-signals")
async def collect_signals(request: CollectSignalRequest):
    """
    Collect real demand signals for a single product.
    Called by Node.js demandService.js instead of generating simulated data.
    """
    result = await collect_real_demand_signal(
        product_name=request.product_name,
        category=request.category,
        city=request.city,
    )
    return result


@router.post("/collect-signals/bulk")
async def collect_bulk(request: BulkCollectRequest):
    """
    Collect real demand signals for multiple products concurrently.
    """
    results = await collect_bulk_signals(
        products=request.products,
        city=request.city,
    )
    return {"signals": results, "count": len(results)}
