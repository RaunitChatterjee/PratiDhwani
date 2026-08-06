"""
PratiDhwani
------------
Prediction Service
"""

from backend.services.ensemble_service import EnsembleService


class PredictionService:

    def __init__(self):

        self.ensemble = EnsembleService(
            "ml/checkpoints/best_model.pt"
        )

    def predict(self, audio_path):

        result = self.ensemble.predict(
            audio_path
        )

        return result

    def model_status(self):
        """
        Per-model status (active / coming soon) for the ensemble's
        registered models. Not used by /predict — available for a future
        status surface (e.g. an expanded /health payload) without
        changing the existing prediction contract.
        """
        return self.ensemble.model_status()
