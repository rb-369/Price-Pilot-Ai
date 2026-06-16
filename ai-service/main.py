from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.forecast import router as forecast_router
from routes.optimize import router as optimize_router
from routes.insights import router as insights_router
from routes.scraper import router as scraper_router   # NEW
from routes.chat import router as chat_router
from routes.product_gen import router as product_gen_router
from routes.sentiment import router as sentiment_router

app = FastAPI(
    title="EcomAI Intelligence Service",
    description="AI microservice for demand forecasting, pricing optimization, and insight generation",
    version="2.0.0",
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
app.include_router(scraper_router, prefix="/api", tags=["Scraper"])   # NEW
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(product_gen_router, prefix="/api", tags=["Product Gen"])
app.include_router(sentiment_router, prefix="/api", tags=["Sentiment"])


@app.get("/")
def health():
    return {"status": "ok", "service": "EcomAI Intelligence", "version": "2.0.0"}