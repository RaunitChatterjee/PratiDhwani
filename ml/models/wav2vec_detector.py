"""
PratiDhwani
------------
Baseline Wav2Vec2 Detector
"""

import torch.nn as nn

from transformers import Wav2Vec2Model

from config.settings import BASE_MODEL


class Wav2VecDetector(nn.Module):

    def __init__(self):

        super().__init__()

        self.encoder = Wav2Vec2Model.from_pretrained(BASE_MODEL)

        hidden = self.encoder.config.hidden_size

        self.classifier = nn.Sequential(
            nn.Linear(hidden, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 2),
        )

    def forward(self, input_values, attention_mask):

        outputs = self.encoder(
            input_values=input_values,
            attention_mask=attention_mask,
        )

        pooled = outputs.last_hidden_state.mean(dim=1)

        return self.classifier(pooled)