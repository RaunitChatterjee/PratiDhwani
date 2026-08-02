"""
PratiDhwani
------------
FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.predict import router as predict_router

app = FastAPI(
    title="PratiDhwani API",
    description="AI-powered Deepfake Speech Detection",
    version="1.0.0",
)

# Allow React frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    predict_router,
)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "PratiDhwani API",
    }