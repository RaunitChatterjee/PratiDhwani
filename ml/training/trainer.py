"""
PratiDhwani
------------
Training engine.
"""

from tqdm import tqdm

import torch


class Trainer:

    def __init__(
        self,
        model,
        train_loader,
        optimizer,
        scheduler,
        criterion,
        device,
    ):

        self.model = model.to(device)
        self.train_loader = train_loader
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.criterion = criterion
        self.device = device

    def train_epoch(self):

        self.model.train()

        running_loss = 0.0

        progress = tqdm(
            self.train_loader,
            desc="Training",
            leave=False,
        )

        for batch in progress:

            input_values = batch["input_values"].to(self.device)
            attention_mask = batch["attention_mask"].to(self.device)
            labels = batch["labels"].to(self.device)

            self.optimizer.zero_grad()

            outputs = self.model(
                input_values=input_values,
                attention_mask=attention_mask,
            )

            loss = self.criterion(
                outputs,
                labels,
            )

            loss.backward()

            self.optimizer.step()

            if self.scheduler is not None:
                self.scheduler.step()

            running_loss += loss.item()

            progress.set_postfix(
                loss=f"{loss.item():.4f}"
            )

        return running_loss / len(self.train_loader)