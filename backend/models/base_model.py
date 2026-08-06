"""
PratiDhwani
------------
BaseModel — common interface for every deepfake-detection model in the
PratiDhwani ensemble.

This defines the contract `EnsembleService` relies on so new models
(AASIST, RawNet2, or anything added later) can be dropped in without
touching the API layer or any existing model's code. It intentionally
says nothing about *how* a model preprocesses audio or loads weights —
that stays entirely inside each model's own implementation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseModel(ABC):
    """
    Subclasses must implement `predict()` and return a dict shaped exactly
    like PratiDhwani's existing prediction output:

        {
            "prediction": "bonafide" | "spoof",
            "confidence": float,           # 0.0 - 1.0
            "probabilities": {
                "bonafide": float,         # 0.0 - 1.0
                "spoof": float,            # 0.0 - 1.0
            },
        }

    This is the same shape the original `Predictor.predict()` already
    returned, so wrapping it in `BaseModel` doesn't change the contract
    consumed by `PredictionService` or the `/predict` route.
    """

    #: Human-readable, stable identifier surfaced to the API/frontend.
    name: str = "base"

    #: Whether this model has a real, loaded implementation behind it.
    #: Placeholder models (AASIST, RawNet2) report False until a real
    #: implementation replaces the placeholder.
    is_implemented: bool = False

    @abstractmethod
    def predict(self, audio_path: str) -> Dict[str, Any]:
        """Run inference on a single audio file and return the result."""
        raise NotImplementedError


class ModelNotImplementedError(RuntimeError):
    """Raised when a placeholder (not-yet-implemented) model is invoked."""
