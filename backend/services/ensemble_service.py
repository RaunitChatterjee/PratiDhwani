"""
PratiDhwani
-----------
Ensemble Service

Coordinates the registered deepfake-detection models and combines their
probabilities into a single final prediction.

Currently implemented:
    - Wav2Vec2
    - AASIST

RawNet2 remains registered but inactive until its real implementation
is integrated.

Fusion strategy:
    Weighted probability fusion.

By default:
    Wav2Vec2 = 0.50
    AASIST   = 0.50

If an active model fails during inference, the ensemble continues with
the successfully evaluated models and renormalizes their weights.
"""

import time
from typing import Any, Dict, List

from backend.core.logging_config import get_logger
from backend.models.aasist_model import AasistModel
from backend.models.rawnet2_model import RawNet2Model
from backend.models.wav2vec2_model import Wav2Vec2Model


logger = get_logger("pratidhwani.ensemble")


class EnsembleService:

    MODEL_CLASSES = [
        Wav2Vec2Model,
        AasistModel,
        RawNet2Model,
    ]

    DEFAULT_WEIGHTS = {
        "wav2vec2": 0.50,
        "aasist": 0.50,
    }

    def __init__(
        self,
        checkpoint_path: str = "ml/checkpoints/best_model.pt",
        aasist_checkpoint_path: str = "ml/checkpoints/aasist/AASIST.pth",
        model_weights: Dict[str, float] | None = None,
    ):
        """
        Initialize the ensemble.

        model_weights:
            Optional mapping from model name to fusion weight.

        Example:

            {
                "wav2vec2": 0.6,
                "aasist": 0.4,
            }

        Weights are normalized automatically so their sum becomes 1.0.
        """

        self.models = [
            Wav2Vec2Model(checkpoint_path),
            AasistModel(aasist_checkpoint_path),
            RawNet2Model(),
        ]

        configured_weights = (
            model_weights
            if model_weights is not None
            else self.DEFAULT_WEIGHTS.copy()
        )

        self.model_weights = self._validate_and_normalize_weights(
            configured_weights
        )

        logger.info(
            "ensemble_initialized",
            extra={
                "registered_models": [
                    model.name for model in self.models
                ],
                "model_weights": self.model_weights,
            },
        )

    @staticmethod
    def _validate_and_normalize_weights(
        weights: Dict[str, float],
    ) -> Dict[str, float]:
        """
        Validate and normalize fusion weights.

        Only positive finite weights are accepted.
        At least one model must have a non-zero weight.
        """

        if not weights:
            raise ValueError(
                "Ensemble model weights cannot be empty."
            )

        normalized_input: Dict[str, float] = {}

        for model_name, weight in weights.items():

            try:
                numeric_weight = float(weight)
            except (TypeError, ValueError) as exc:
                raise ValueError(
                    f"Invalid ensemble weight for '{model_name}': "
                    f"{weight!r}"
                ) from exc

            if numeric_weight < 0:
                raise ValueError(
                    f"Ensemble weight for '{model_name}' "
                    f"cannot be negative."
                )

            if numeric_weight != numeric_weight:
                raise ValueError(
                    f"Ensemble weight for '{model_name}' "
                    f"cannot be NaN."
                )

            if numeric_weight == float("inf"):
                raise ValueError(
                    f"Ensemble weight for '{model_name}' "
                    f"cannot be infinite."
                )

            normalized_input[model_name] = numeric_weight

        total = sum(normalized_input.values())

        if total <= 0:
            raise ValueError(
                "At least one ensemble model weight must be greater "
                "than zero."
            )

        return {
            model_name: weight / total
            for model_name, weight in normalized_input.items()
        }

    def _active_models(self) -> List:
        """
        Return only models with a real implementation.
        """
        return [
            model
            for model in self.models
            if model.is_implemented
        ]

    @classmethod
    def static_model_status(
        cls,
    ) -> List[Dict[str, Any]]:
        """
        Return model status without instantiating models.

        Safe for /health because this does not load checkpoints.
        """

        return [
            {
                "name": model_cls.name,
                "implemented": model_cls.is_implemented,
                "status": (
                    "active"
                    if model_cls.is_implemented
                    else "coming_soon"
                ),
            }
            for model_cls in cls.MODEL_CLASSES
        ]

    def model_status(self) -> List[Dict[str, Any]]:
        """
        Instance-level model status.
        """
        return self.static_model_status()

    def _predict_model(
        self,
        model,
        audio_path: str,
    ) -> Dict[str, Any]:
        """
        Execute one model and attach execution metadata.

        Raises exceptions to the caller so the ensemble can decide how
        to handle model-level failures.
        """

        started_at = time.perf_counter()

        try:
            result = model.predict(audio_path)

        except Exception as exc:
            duration_ms = round(
                (time.perf_counter() - started_at) * 1000,
                2,
            )

            logger.exception(
                "model_inference_failed",
                extra={
                    "model": model.name,
                    "duration_ms": duration_ms,
                },
            )

            raise exc

        duration_ms = round(
            (time.perf_counter() - started_at) * 1000,
            2,
        )

        logger.info(
            "model_inference_completed",
            extra={
                "model": model.name,
                "prediction": result.get("prediction"),
                "confidence": result.get("confidence"),
                "duration_ms": duration_ms,
            },
        )

        return {
            **result,
            "model": model.name,
            "duration_ms": duration_ms,
        }

    def _effective_weights(
        self,
        model_results: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """
        Calculate normalized fusion weights using only models that
        successfully produced predictions.
        """

        available_weights = {
            result["model"]: self.model_weights.get(
                result["model"],
                0.0,
            )
            for result in model_results
        }

        total = sum(available_weights.values())

        if total <= 0:
            raise ValueError(
                "No successful model has a positive fusion weight."
            )

        return {
            model_name: weight / total
            for model_name, weight in available_weights.items()
        }

    def _fuse_predictions(
        self,
        model_results: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Combine model probabilities using weighted probability fusion.

        Only successfully evaluated models participate in fusion.

        Their configured weights are renormalized so that the effective
        weights sum to 1.0.
        """

        if not model_results:
            raise ValueError(
                "Cannot fuse predictions from zero models."
            )

        effective_weights = self._effective_weights(
            model_results
        )

        weighted_spoof_probability = 0.0

        fusion_details: List[Dict[str, Any]] = []

        for result in model_results:

            model_name = result["model"]

            weight = effective_weights.get(
                model_name,
                0.0,
            )

            probabilities = result.get(
                "probabilities",
                {},
            )

            spoof_probability = float(
                probabilities.get(
                    "spoof",
                    0.0,
                )
            )

            weighted_contribution = (
                spoof_probability * weight
            )

            weighted_spoof_probability += (
                weighted_contribution
            )

            fusion_details.append(
                {
                    "model": model_name,
                    "configured_weight": self.model_weights.get(
                        model_name,
                        0.0,
                    ),
                    "effective_weight": weight,
                    "spoof_probability": spoof_probability,
                    "weighted_contribution": (
                        weighted_contribution
                    ),
                }
            )

        weighted_spoof_probability = min(
            max(
                weighted_spoof_probability,
                0.0,
            ),
            1.0,
        )

        weighted_bonafide_probability = (
            1.0 - weighted_spoof_probability
        )

        if (
            weighted_spoof_probability
            >= weighted_bonafide_probability
        ):
            prediction = "spoof"
            confidence = weighted_spoof_probability
        else:
            prediction = "bonafide"
            confidence = weighted_bonafide_probability

        return {
            "prediction": prediction,
            "confidence": confidence,
            "probabilities": {
                "bonafide": weighted_bonafide_probability,
                "spoof": weighted_spoof_probability,
            },
            "fusion": {
                "strategy": "weighted_probability",
                "weights": effective_weights,
                "configured_weights": self.model_weights.copy(),
                "details": fusion_details,
            },
        }

    def predict(
        self,
        audio_path: str,
    ) -> Dict[str, Any]:
        """
        Run all active models and produce the fused prediction.

        A failure in one model does not terminate the complete ensemble.
        Successful models continue to participate in fusion.
        """

        active_models = self._active_models()

        if not active_models:
            logger.error(
                "ensemble_no_active_models"
            )

            raise RuntimeError(
                "No implemented models are available "
                "in the ensemble."
            )

        model_results: List[Dict[str, Any]] = []
        model_errors: List[Dict[str, Any]] = []

        for model in active_models:

            try:
                result = self._predict_model(
                    model,
                    audio_path,
                )

                model_results.append(result)

            except Exception as exc:

                model_errors.append(
                    {
                        "model": model.name,
                        "error": type(exc).__name__,
                        "message": str(exc),
                    }
                )

                logger.warning(
                    "model_skipped_after_inference_failure",
                    extra={
                        "model": model.name,
                        "error": type(exc).__name__,
                    },
                )

        if not model_results:

            logger.error(
                "ensemble_all_models_failed",
                extra={
                    "errors": model_errors,
                },
            )

            raise RuntimeError(
                "All active models failed during inference."
            )

        fused_result = self._fuse_predictions(
            model_results
        )

        logger.info(
            "ensemble_fusion_completed",
            extra={
                "prediction": fused_result["prediction"],
                "confidence": fused_result["confidence"],
                "probabilities": fused_result["probabilities"],
                "weights": fused_result["fusion"]["weights"],
                "failed_models": [
                    error["model"]
                    for error in model_errors
                ],
            },
        )

        response = {
            **fused_result,
            "models": model_results,
        }

        if model_errors:
            response["model_errors"] = model_errors
            response["degraded"] = True
        else:
            response["degraded"] = False

        return response