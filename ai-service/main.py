from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.forecast import router as forecast_router
from routes.optimize import router as optimize_router
from routes.insights import router as insights_router

app = FastAPI(
    title="EcomAI Intelligence Service",
    description="AI microservice for demand forecasting, pricing optimization, and insight generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast_router, prefix="/api", tags=["Forecasting"])
app.include_router(optimize_router, prefix="/api", tags=["Optimization"])
app.include_router(insights_router, prefix="/api", tags=["Insights"])


@app.get("/")
def health():
    return {"status": "ok", "service": "EcomAI Intelligence"}
