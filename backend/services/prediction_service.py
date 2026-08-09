"""
PratiDhwani
------------
Prediction Service
"""

import threading

from backend.services.ensemble_service import EnsembleService
from backend.core.logging_config import get_logger

logger = get_logger("pratidhwani.prediction_service")


class PredictionService:

    def __init__(self, checkpoint_path: str = "ml/checkpoints/best_model.pt", lazy: bool = False):
        self._checkpoint_path = checkpoint_path
        self._ensemble = None
        self._lock = threading.Lock()

        if not lazy:
            self._ensure_loaded()

    def _ensure_loaded(self) -> EnsembleService:
        """
        Thread-safe lazy initialization. Cheap to call on every request —
        once `_ensemble` is set, this is a single non-locking attribute
        read, so lazy mode costs nothing after the first request.
        """
        if self._ensemble is None:
            with self._lock:
                if self._ensemble is None:  # re-check inside the lock
                    logger.info("model_loading_started", extra={"checkpoint": self._checkpoint_path})
                    self._ensemble = EnsembleService(self._checkpoint_path)
                    logger.info("model_loading_completed", extra={"checkpoint": self._checkpoint_path})
        return self._ensemble

    @property
    def is_loaded(self) -> bool:
        return self._ensemble is not None

    def warm_up(self) -> None:
        """Explicit eager-load hook, called from the app's startup event."""
        self._ensure_loaded()

    def predict(self, audio_path):
        ensemble = self._ensure_loaded()
        result = ensemble.predict(audio_path)
        return result

    def model_status(self):
        """
        Per-model status (active / coming soon) for the ensemble's
        registered models. Computed statically — does NOT trigger a lazy
        model load, so calling this from /health is always cheap.
        """
        return EnsembleService.static_model_status()
