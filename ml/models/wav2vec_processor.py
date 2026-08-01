"""
PratiDhwani
------------
Wav2Vec2 Processor
"""

from transformers import AutoProcessor

from config.settings import BASE_MODEL


class Wav2VecProcessor:

    def __init__(self):

        self.processor = AutoProcessor.from_pretrained(
            BASE_MODEL
        )

    def process(self, waveforms):

        return self.processor(
            waveforms,
            sampling_rate=16000,
            padding=True,
            truncation=True,
            max_length=160000,
            return_attention_mask=True,
            return_tensors="pt",
        )