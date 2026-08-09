"""
PratiDhwani
------------
Shared singleton accessors, usable as FastAPI dependencies (`Depends(...)`)
or called directly. Centralizing this means there's exactly one
`PredictionService` per process regardless of how many places need it
(the /predict route, /health, startup events, tests).
"""

from functools import lru_cache

from backend.core.config import get_settings
from backend.services.prediction_service import PredictionService


@lru_cache
def get_prediction_service() -> PredictionService:
    settings = get_settings()
    return PredictionService(
        checkpoint_path=settings.checkpoint_path,
        lazy=not settings.effective_warm_start,
    )
