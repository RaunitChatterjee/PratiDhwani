"""
PratiDhwani
------------
Model evaluation engine.
"""

import torch
from tqdm import tqdm

from ml.evaluation.metrics import compute_metrics


class Evaluator:

    def __init__(
        self,
        model,
        dataloader,
        device,
    ):

        self.model = model.to(device)
        self.dataloader = dataloader
        self.device = device

    @torch.no_grad()
    def evaluate(self):

        self.model.eval()

        y_true = []
        y_pred = []

        progress = tqdm(
            self.dataloader,
            desc="Evaluating",
            leave=False,
        )

        for batch in progress:

            input_values = batch["input_values"].to(self.device)
            attention_mask = batch["attention_mask"].to(self.device)
            labels = batch["labels"].to(self.device)

            outputs = self.model(
                input_values=input_values,
                attention_mask=attention_mask,
            )

            predictions = outputs.argmax(dim=1)

            y_true.extend(labels.cpu().tolist())
            y_pred.extend(predictions.cpu().tolist())

        return compute_metrics(
            y_true,
            y_pred,
        )