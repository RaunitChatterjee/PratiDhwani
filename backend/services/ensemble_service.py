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

from typing import Any, Dict, List

from backend.models.wav2vec2_model import Wav2Vec2Model
from backend.models.aasist_model import AasistModel
from backend.models.rawnet2_model import RawNet2Model


class EnsembleService:

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

    def _active_models(self) -> List:
        return [model for model in self.models if model.is_implemented]

    def model_status(self) -> List[Dict[str, Any]]:
        """
        Per-model status, intended for the frontend's Model Results panel
        (or a future `/models` health surface). Doesn't run inference.
        """
        return [
            {
                "name": model.name,
                "implemented": model.is_implemented,
                "status": "active" if model.is_implemented else "coming_soon",
            }
            for model in self.models
        ]

    def predict(self, audio_path: str) -> Dict[str, Any]:
        active_models = self._active_models()

        if not active_models:
            raise RuntimeError("No implemented models are available in the ensemble.")

        # Only Wav2Vec2 is implemented today. Returning its result as-is
        # is what keeps /predict's output identical to calling the
        # original Predictor directly — no averaging, voting, or
        # reweighting happens while it's the sole active model.
        primary_model = active_models[0]
        return primary_model.predict(audio_path)
