"""
PratiDhwani
------------
FastAPI Application
"""

from fastapi import FastAPI

from backend.api.predict import router as predict_router


app = FastAPI(
    title="PratiDhwani API",
    description="AI-powered Deepfake Speech Detection",
    version="1.0.0",
)

app.include_router(
    predict_router,
)