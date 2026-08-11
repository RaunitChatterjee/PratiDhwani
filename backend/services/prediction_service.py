"""
PratiDhwani
------------
Prediction Service

Provides the public prediction interface while preserving the
original API response contract:

    {
        "prediction": ...,
        "confidence": ...,
        "probabilities": ...
    }

The underlying EnsembleService may contain additional information
such as model-level predictions and fusion details, but those are
kept internal to this service.
"""

import threading

from backend.core.logging_config import get_logger
from backend.services.ensemble_service import EnsembleService


logger = get_logger("pratidhwani.prediction_service")


class PredictionService:

    def __init__(
        self,
        checkpoint_path: str = "ml/checkpoints/best_model.pt",
        lazy: bool = False,
    ):
        self._checkpoint_path = checkpoint_path
        self._ensemble = None
        self._lock = threading.Lock()

        if not lazy:
            self._ensure_loaded()

    def _ensure_loaded(self) -> EnsembleService:
        """
        Thread-safe lazy initialization.
        """
        if self._ensemble is None:
            with self._lock:
                if self._ensemble is None:
                    logger.info(
                        "model_loading_started",
                        extra={
                            "checkpoint": self._checkpoint_path
                        },
                    )

                    self._ensemble = EnsembleService(
                        self._checkpoint_path
                    )

                    logger.info(
                        "model_loading_completed",
                        extra={
                            "checkpoint": self._checkpoint_path
                        },
                    )

        return self._ensemble

    @property
    def is_loaded(self) -> bool:
        return self._ensemble is not None

    def warm_up(self) -> None:
        """
        Explicit eager-load hook.
        """
        self._ensure_loaded()

    def predict(self, audio_path):
        """
        Run ensemble inference while preserving the original
        PredictionService response contract.

        The EnsembleService may return additional metadata such as:
            - fusion
            - models
            - degraded
            - model_errors

        Those fields remain internal and are not exposed here.
        """

        ensemble = self._ensure_loaded()

        result = ensemble.predict(audio_path)

        return {
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "probabilities": result["probabilities"],
        }

    def model_status(self):
        """
        Return per-model status without forcing model loading.
        """
        return EnsembleService.static_model_status()