"""
PratiDhwani
------------
FastAPI Application
"""

import time

import torch
import transformers
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.predict import router as predict_router

START_TIME = time.time()

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

app.include_router(predict_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "PratiDhwani API",
        "version": app.version,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "PratiDhwani API",
        "version": app.version,
        "model_loaded": True,
        "model_name": "Wav2Vec2 Deepfake Detector",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "torch_version": torch.__version__,
        "transformers_version": transformers.__version__,
        "uptime_seconds": round(time.time() - START_TIME, 2),
    }