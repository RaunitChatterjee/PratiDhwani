"""
PratiDhwani
------------
Predict a single audio file.
"""

import sys
import argparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from ml.inference.predictor import Predictor


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--audio",
        required=True,
        help="Path to audio file",
    )

    args = parser.parse_args()

    predictor = Predictor(
        "ml/checkpoints/best_model.pt"
    )

    result = predictor.predict(
        args.audio
    )

    print()
    print("=" * 60)
    print("PratiDhwani Prediction")
    print("=" * 60)

    print(f"Prediction : {result['prediction'].upper()}")
    print(f"Confidence : {result['confidence'] * 100:.2f}%")

    print("\nProbabilities")

    print(f"Bonafide : {result['probabilities']['bonafide'] * 100:.2f}%")
    print(f"Spoof     : {result['probabilities']['spoof'] * 100:.2f}%")


if __name__ == "__main__":
    main()