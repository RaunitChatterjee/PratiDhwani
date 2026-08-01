"""
PratiDhwani
------------
Checkpoint utilities.
"""

import torch

from config.settings import CHECKPOINT_DIR


class CheckpointManager:

    def __init__(self):

        self.best_accuracy = 0.0

    def save(
        self,
        model,
        optimizer,
        epoch,
        accuracy,
        filename="best_model.pt",
    ):

        if accuracy <= self.best_accuracy:
            return False

        self.best_accuracy = accuracy

        checkpoint = {
            "epoch": epoch,
            "accuracy": accuracy,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
        }

        save_path = CHECKPOINT_DIR / filename

        torch.save(
            checkpoint,
            save_path,
        )

        print()
        print("=" * 60)
        print("New Best Model Saved")
        print("=" * 60)
        print(f"Epoch    : {epoch}")
        print(f"Accuracy : {accuracy:.4f}")
        print(f"Saved to : {save_path}")
        print("=" * 60)

        return True