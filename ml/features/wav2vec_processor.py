"""
PratiDhwani
------------
Wav2Vec2 Processor
"""

from transformers import AutoFeatureExtractor

from config.settings import BASE_MODEL


class Wav2VecProcessor:

    def __init__(self):

        self.processor = AutoFeatureExtractor.from_pretrained(
            BASE_MODEL
        )

    def process(self, waveform):

        waveform = waveform.squeeze().numpy()

        return self.processor(
            waveform,
            sampling_rate=16000,
            return_tensors="pt",
            padding=True,
        )