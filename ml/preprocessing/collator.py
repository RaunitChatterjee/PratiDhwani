"""
PratiDhwani
------------
Custom Wav2Vec2 Data Collator.
"""

import torch

from ml.features.wav2vec_processor import Wav2VecProcessor


class Wav2VecCollator:

    def __init__(self):

        self.processor = Wav2VecProcessor()

    def __call__(self, batch):

        waveforms = []
        labels = []

        for sample in batch:

            waveforms.append(
                sample["waveform"].squeeze().numpy()
            )

            labels.append(sample["label"])

        encoded = self.processor.process(
            waveforms
        )

        encoded["labels"] = torch.stack(labels)

        return encoded