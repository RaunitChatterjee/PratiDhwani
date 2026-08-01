"""
PratiDhwani
------------
Audio preprocessing for inference.
"""

import torchaudio

from config.settings import SAMPLE_RATE
from ml.models.wav2vec_processor import Wav2VecProcessor


class AudioProcessor:

    def __init__(self):

        self.processor = Wav2VecProcessor()

    def process(self, audio_path):

        waveform, sample_rate = torchaudio.load(audio_path)

        # Stereo → Mono
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Resample
        if sample_rate != SAMPLE_RATE:

            resampler = torchaudio.transforms.Resample(
                sample_rate,
                SAMPLE_RATE,
            )

            waveform = resampler(waveform)

        waveform = waveform.squeeze(0)

        inputs = self.processor.process(
            waveform,
        )

        return {
            "input_values": inputs["input_values"],
            "attention_mask": inputs["attention_mask"],
        }