"""
PratiDhwani
------------
Training entry point.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from config.settings import (
    DEVICE,
    LEARNING_RATE,
    BATCH_SIZE,
    NUM_EPOCHS,
)

from ml.preprocessing.dataloader import get_dataloader
from ml.models.wav2vec_detector import Wav2VecDetector

from ml.training.loss import get_loss
from ml.training.optimizer import get_optimizer
from ml.training.scheduler import get_scheduler
from ml.training.trainer import Trainer
from ml.training.validator import Validator
from ml.training.checkpoint import CheckpointManager


def main():

    # ------------------------------------------------------------------
    # Debug Dataset
    # ------------------------------------------------------------------

    train_loader = get_dataloader(
        "ml/metadata/train_small.csv",
        batch_size=BATCH_SIZE,
        shuffle=True,
    )

    val_loader = get_dataloader(
        "ml/metadata/dev_small.csv",
        batch_size=BATCH_SIZE,
        shuffle=False,
    )

    # ------------------------------------------------------------------
    # Model
    # ------------------------------------------------------------------

    model = Wav2VecDetector()

    criterion = get_loss()

    optimizer = get_optimizer(
        model,
        LEARNING_RATE,
    )

    total_steps = len(train_loader) * NUM_EPOCHS

    scheduler = get_scheduler(
        optimizer,
        warmup_steps=int(0.1 * total_steps),
        total_steps=total_steps,
    )

    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        optimizer=optimizer,
        scheduler=scheduler,
        criterion=criterion,
        device=DEVICE,
    )

    validator = Validator(
        model=model,
        val_loader=val_loader,
        criterion=criterion,
        device=DEVICE,
    )

    checkpoint_manager = CheckpointManager()

    # ------------------------------------------------------------------
    # Training Loop
    # ------------------------------------------------------------------

    for epoch in range(NUM_EPOCHS):

        print("\n" + "=" * 60)
        print(f"Epoch {epoch + 1}/{NUM_EPOCHS}")
        print("=" * 60)

        train_loss = trainer.train_epoch()

        val_loss, val_accuracy = validator.validate()

        checkpoint_manager.save(
            model=model,
            optimizer=optimizer,
            epoch=epoch + 1,
            accuracy=val_accuracy,
        )

        print("\nResults")
        print("-" * 60)
        print(f"Train Loss : {train_loss:.4f}")
        print(f"Val Loss   : {val_loss:.4f}")
        print(f"Val Acc    : {val_accuracy:.4f}")


if __name__ == "__main__":
    main()