"""
PratiDhwani
------------
Model Predictor
"""

import torch

from config.settings import DEVICE
from ml.models.wav2vec_detector import Wav2VecDetector
from ml.inference.audio_processor import AudioProcessor


class Predictor:

    def __init__(self, checkpoint_path):

        self.device = DEVICE

        self.processor = AudioProcessor()

        self.model = Wav2VecDetector().to(self.device)

        checkpoint = torch.load(
            checkpoint_path,
            map_location=self.device,
        )

        self.model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        self.model.eval()

    @torch.no_grad()
    def predict(self, audio_path):

        sample = self.processor.process(audio_path)

        input_values = sample["input_values"].to(self.device)
        attention_mask = sample["attention_mask"].to(self.device)

        outputs = self.model(
            input_values=input_values,
            attention_mask=attention_mask,
        )

        probabilities = torch.softmax(
            outputs,
            dim=1,
        )

        confidence, prediction = torch.max(
            probabilities,
            dim=1,
        )

        labels = [
            "bonafide",
            "spoof",
        ]

        return {
            "prediction": labels[prediction.item()],
            "confidence": confidence.item(),
            "probabilities": {
                "bonafide": probabilities[0][0].item(),
                "spoof": probabilities[0][1].item(),
            },
        }