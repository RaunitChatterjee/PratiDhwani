"""
PratiDhwani
------------
Checkpoint utilities.
"""

from pathlib import Path
import torch

from config.settings import CHECKPOINT_DIR


CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)


def save_checkpoint(model, optimizer, epoch, loss):

    checkpoint = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "loss": loss,
    }

    path = CHECKPOINT_DIR / f"epoch_{epoch}.pt"

    torch.save(checkpoint, path)

    print(f"Checkpoint saved -> {path}")