"""
PratiDhwani
------------
Evaluate a trained checkpoint.
"""

import sys
from pathlib import Path

import torch

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from config.settings import DEVICE
from ml.preprocessing.dataloader import get_dataloader
from ml.models.wav2vec_detector import Wav2VecDetector
from ml.evaluation.evaluator import Evaluator


def main():

    checkpoint_path = "ml/checkpoints/best_model.pt"

    model = Wav2VecDetector()

    checkpoint = torch.load(
        checkpoint_path,
        map_location=DEVICE,
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    dataloader = get_dataloader(
        "ml/metadata/dev_small.csv",
        batch_size=2,
        shuffle=False,
    )

    evaluator = Evaluator(
        model=model,
        dataloader=dataloader,
        device=DEVICE,
    )

    metrics = evaluator.evaluate()

    print("\n" + "=" * 60)
    print("Evaluation Results")
    print("=" * 60)

    print(f"Accuracy : {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall   : {metrics['recall']:.4f}")
    print(f"F1 Score : {metrics['f1']:.4f}")

    print("\nConfusion Matrix")

    print(metrics["confusion_matrix"])


if __name__ == "__main__":
    main()