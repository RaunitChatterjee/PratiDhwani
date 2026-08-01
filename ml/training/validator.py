"""
PratiDhwani
------------
Validation engine.
"""

import torch

from tqdm import tqdm


class Validator:

    def __init__(
        self,
        model,
        val_loader,
        criterion,
        device,
    ):

        self.model = model
        self.val_loader = val_loader
        self.criterion = criterion
        self.device = device

    @torch.no_grad()
    def validate(self):

        self.model.eval()

        running_loss = 0.0

        correct = 0
        total = 0

        progress = tqdm(
            self.val_loader,
            desc="Validation",
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

            loss = self.criterion(
                outputs,
                labels,
            )

            running_loss += loss.item()

            predictions = outputs.argmax(dim=1)

            correct += (predictions == labels).sum().item()

            total += labels.size(0)

        accuracy = correct / total

        return (
            running_loss / len(self.val_loader),
            accuracy,
        )