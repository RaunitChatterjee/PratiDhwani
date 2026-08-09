"""
PratiDhwani
------------
Ensemble Service

Coordinates every registered detection model (each a `BaseModel`
implementation) and produces a single prediction, plus a per-model status
report for the frontend's Model Results panel.

Today only Wav2Vec2 is implemented, so its output is passed through
unchanged — `/predict`'s response stays byte-for-byte identical to the
pre-refactor behavior. AASIST and RawNet2 are registered so their status
is visible everywhere else in the system, but they're skipped at
inference time until they're actually implemented.

When a second model becomes real, `predict()` is the *only* place that
needs to change to start aggregating outputs (e.g. averaging
probabilities, majority vote, or a weighted ensemble) instead of a
straight pass-through.
"""

import time
from typing import Any, Dict, List

from backend.models.wav2vec2_model import Wav2Vec2Model
from backend.models.aasist_model import AasistModel
from backend.models.rawnet2_model import RawNet2Model
from backend.core.logging_config import get_logger

logger = get_logger("pratidhwani.ensemble")


class EnsembleService:

    # Registered model classes. Kept as a class-level list (separate from
    # `self.models`) so status (name, implemented) can be reported
    # without instantiating — and therefore without loading checkpoints
    # into memory — which matters for lazy-loading deployments where
    # /health shouldn't force a full model load.
    MODEL_CLASSES = [Wav2Vec2Model, AasistModel, RawNet2Model]

    def __init__(self, checkpoint_path: str = "ml/checkpoints/best_model.pt"):
        # Every registered model, implemented or not. Registration order
        # only affects display and which model is treated as "primary"
        # while just one is implemented — it has no effect on Wav2Vec2's
        # own prediction logic.
        self.models = [
            Wav2Vec2Model(checkpoint_path),
            AasistModel(),
            RawNet2Model(),
        ]
        logger.info(
            "ensemble_initialized",
            extra={"registered_models": [m.name for m in self.models]},
        )

    def _active_models(self) -> List:
        return [model for model in self.models if model.is_implemented]

    @classmethod
    def static_model_status(cls) -> List[Dict[str, Any]]:
        """
        Per-model status computed from class attributes alone — safe to
        call before any model has been loaded (e.g. from /health under
        lazy loading), since it never instantiates a model or touches a
        checkpoint.
        """
        return [
            {
                "name": model_cls.name,
                "implemented": model_cls.is_implemented,
                "status": "active" if model_cls.is_implemented else "coming_soon",
            }
            for model_cls in cls.MODEL_CLASSES
        ]

    def model_status(self) -> List[Dict[str, Any]]:
        """Instance-level convenience wrapper around `static_model_status`."""
        return self.static_model_status()

    def predict(self, audio_path: str) -> Dict[str, Any]:
        active_models = self._active_models()

        if not active_models:
            logger.error("ensemble_no_active_models")
            raise RuntimeError("No implemented models are available in the ensemble.")

        # Only Wav2Vec2 is implemented today. Returning its result as-is
        # is what keeps /predict's output identical to calling the
        # original Predictor directly — no averaging, voting, or
        # reweighting happens while it's the sole active model.
        primary_model = active_models[0]

        started_at = time.perf_counter()
        try:
            result = primary_model.predict(audio_path)
        except Exception:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            logger.exception(
                "inference_failed",
                extra={"model": primary_model.name, "duration_ms": duration_ms},
            )
            raise

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        logger.info(
            "inference_completed",
            extra={
                "model": primary_model.name,
                "prediction": result.get("prediction"),
                "confidence": result.get("confidence"),
                "duration_ms": duration_ms,
            },
        )

        return result
