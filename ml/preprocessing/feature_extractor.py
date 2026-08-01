"""
PratiDhwani
------------
Feature extraction utilities.
"""

import librosa
import numpy as np


class FeatureExtractor:

    def __init__(self, sample_rate=16000):

        self.sample_rate = sample_rate

    def extract_mfcc(self, waveform):

        audio = waveform.squeeze().numpy()

        mfcc = librosa.feature.mfcc(
            y=audio,
            sr=self.sample_rate,
            n_mfcc=40,
        )

        return mfcc

    def extract_mel(self, waveform):

        audio = waveform.squeeze().numpy()

        mel = librosa.feature.melspectrogram(
            y=audio,
            sr=self.sample_rate,
            n_mels=128,
        )

        return mel

    def extract_all(self, waveform):

        return {
            "mfcc": self.extract_mfcc(waveform),
            "mel": self.extract_mel(waveform),
        }