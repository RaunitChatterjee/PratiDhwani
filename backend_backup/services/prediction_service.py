"""
PratiDhwani
------------
Prediction Service
"""

from ml.inference.predictor import Predictor


class PredictionService:

    def __init__(self):

        self.predictor = Predictor(
            "ml/checkpoints/best_model.pt"
        )

    def predict(self, audio_path):

        result = self.predictor.predict(
            audio_path
        )

        return result