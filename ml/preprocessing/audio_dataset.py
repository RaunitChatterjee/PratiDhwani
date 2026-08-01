"""
PratiDhwani
------------
PyTorch Dataset for ASVspoof2019 LA.
"""

from pathlib import Path

import pandas as pd
import torch
import torchaudio

from torch.utils.data import Dataset

from config.settings import SAMPLE_RATE


LABEL_MAP = {
    "bonafide": 0,
    "spoof": 1,
}


class ASVspoofDataset(Dataset):

    def __init__(self, csv_path):

        self.df = pd.read_csv(csv_path)

        self.resampler = torchaudio.transforms.Resample(
            orig_freq=16000,
            new_freq=SAMPLE_RATE,
        )

    def __len__(self):

        return len(self.df)

    def __getitem__(self, index):

        row = self.df.iloc[index]

        audio_path = Path(row["filepath"])

        waveform, sample_rate = torchaudio.load(audio_path)

        if sample_rate != SAMPLE_RATE:
            waveform = self.resampler(waveform)

        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        label = LABEL_MAP[row["label"]]

        return {
            "waveform": waveform,
            "label": torch.tensor(label, dtype=torch.long),
            "filename": row["filename"],
            "attack": row["attack"],
        }