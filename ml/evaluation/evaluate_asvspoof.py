"""
PratiDhwani
-----------
ASVspoof 2019 LA evaluation runner.

Evaluates:
    - Wav2Vec2
    - AASIST
    - Ensemble

The dataset intentionally lives outside the repository because of its size.
"""

from pathlib import Path
import csv
import random
import sys
import time


# ---------------------------------------------------------------------------
# Make the project root importable.
#
# This script lives at:
#
#     PratiDhwani/ml/evaluation/evaluate_asvspoof.py
#
# Therefore parents[2] is:
#
#     PratiDhwani/
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)

from backend.models.aasist_model import AasistModel
from backend.models.wav2vec2_model import Wav2Vec2Model
from backend.services.ensemble_service import EnsembleService


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATASET_ROOT = Path(
    "/Users/raunitchatterjee/Desktop/Datasets/ASVspoof2019/LA/LA"
)

PROTOCOL_PATH = (
    DATASET_ROOT
    / "ASVspoof2019_LA_cm_protocols"
    / "ASVspoof2019.LA.cm.eval.trl.txt"
)

AUDIO_DIR = (
    DATASET_ROOT
    / "ASVspoof2019_LA_eval"
    / "flac"
)

CHECKPOINT_PATH = (
    PROJECT_ROOT
    / "ml/checkpoints/best_model.pt"
)

AASIST_CHECKPOINT_PATH = (
    PROJECT_ROOT
    / "ml/checkpoints/aasist/AASIST.pth"
)

# Start with a small pilot evaluation.
SAMPLE_SIZE = 1000

# Reproducible sampling.
RANDOM_SEED = 42

RESULTS_DIR = (
    PROJECT_ROOT
    / "ml/evaluation/results"
)


# ---------------------------------------------------------------------------
# Dataset loading
# ---------------------------------------------------------------------------

def load_protocol():
    """
    Read the ASVspoof CM evaluation protocol.

    Format:

        speaker_id file_id environment attack_id label
    """

    entries = []

    with PROTOCOL_PATH.open("r") as file:

        for line in file:

            parts = line.split()

            if len(parts) < 5:
                continue

            speaker_id = parts[0]
            file_id = parts[1]
            attack_id = parts[3]
            label = parts[4]

            if label not in {
                "spoof",
                "bonafide",
            }:
                continue

            audio_path = (
                AUDIO_DIR
                / f"{file_id}.flac"
            )

            if not audio_path.exists():
                continue

            entries.append(
                {
                    "speaker_id": speaker_id,
                    "file_id": file_id,
                    "attack_id": attack_id,
                    "label": label,
                    "audio_path": audio_path,
                }
            )

    return entries


def sample_entries(
    entries,
    sample_size,
):
    """
    Create a deterministic balanced sample.

    Approximately half bonafide and half spoof.
    """

    rng = random.Random(
        RANDOM_SEED
    )

    bonafide = [
        entry
        for entry in entries
        if entry["label"] == "bonafide"
    ]

    spoof = [
        entry
        for entry in entries
        if entry["label"] == "spoof"
    ]

    rng.shuffle(bonafide)
    rng.shuffle(spoof)

    half = sample_size // 2

    selected = (
        bonafide[:half]
        + spoof[:half]
    )

    rng.shuffle(selected)

    return selected


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def calculate_metrics(
    y_true,
    y_pred,
):
    """
    Calculate standard binary classification metrics.

    'spoof' is treated as the positive class.
    """

    return {
        "accuracy": accuracy_score(
            y_true,
            y_pred,
        ),
        "precision": precision_score(
            y_true,
            y_pred,
            pos_label="spoof",
            zero_division=0,
        ),
        "recall": recall_score(
            y_true,
            y_pred,
            pos_label="spoof",
            zero_division=0,
        ),
        "f1": f1_score(
            y_true,
            y_pred,
            pos_label="spoof",
            zero_division=0,
        ),
        "confusion_matrix": confusion_matrix(
            y_true,
            y_pred,
            labels=[
                "bonafide",
                "spoof",
            ],
        ).tolist(),
    }


def print_metrics(
    name,
    y_true,
    y_pred,
):
    """
    Print a readable evaluation summary.
    """

    metrics = calculate_metrics(
        y_true,
        y_pred,
    )

    print()
    print("=" * 70)
    print(name)
    print("=" * 70)

    print(
        f"Accuracy : {metrics['accuracy']:.4f}"
    )

    print(
        f"Precision: {metrics['precision']:.4f}"
    )

    print(
        f"Recall   : {metrics['recall']:.4f}"
    )

    print(
        f"F1       : {metrics['f1']:.4f}"
    )

    print()
    print(
        "Confusion matrix "
        "(rows=true, columns=predicted)"
    )

    print(
        "              bonafide    spoof"
    )

    matrix = metrics[
        "confusion_matrix"
    ]

    print(
        f"bonafide      {matrix[0][0]:8d} "
        f"{matrix[0][1]:8d}"
    )

    print(
        f"spoof         {matrix[1][0]:8d} "
        f"{matrix[1][1]:8d}"
    )

    print()

    print(
        classification_report(
            y_true,
            y_pred,
            labels=[
                "bonafide",
                "spoof",
            ],
            zero_division=0,
        )
    )

    return metrics


# ---------------------------------------------------------------------------
# Main evaluation
# ---------------------------------------------------------------------------

def main():

    print()
    print("=" * 70)
    print(
        "PratiDhwani - ASVspoof 2019 LA Evaluation"
    )
    print("=" * 70)

    # -----------------------------------------------------------------------
    # Validate paths
    # -----------------------------------------------------------------------

    if not DATASET_ROOT.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_ROOT}"
        )

    if not PROTOCOL_PATH.exists():
        raise FileNotFoundError(
            f"Protocol not found: {PROTOCOL_PATH}"
        )

    if not AUDIO_DIR.exists():
        raise FileNotFoundError(
            f"Audio directory not found: {AUDIO_DIR}"
        )

    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(
            f"Wav2Vec2 checkpoint not found: "
            f"{CHECKPOINT_PATH}"
        )

    if not AASIST_CHECKPOINT_PATH.exists():
        raise FileNotFoundError(
            f"AASIST checkpoint not found: "
            f"{AASIST_CHECKPOINT_PATH}"
        )

    # -----------------------------------------------------------------------
    # Load protocol
    # -----------------------------------------------------------------------

    print()
    print("Loading protocol...")

    entries = load_protocol()

    print(
        f"Valid protocol/audio pairs: "
        f"{len(entries)}"
    )

    print(
        f"Requested evaluation sample: "
        f"{SAMPLE_SIZE}"
    )

    selected = sample_entries(
        entries,
        SAMPLE_SIZE,
    )

    if len(selected) < SAMPLE_SIZE:
        raise RuntimeError(
            f"Only {len(selected)} usable samples "
            f"available."
        )

    bonafide_count = sum(
        entry["label"] == "bonafide"
        for entry in selected
    )

    spoof_count = sum(
        entry["label"] == "spoof"
        for entry in selected
    )

    print(
        f"Selected bonafide: "
        f"{bonafide_count}"
    )

    print(
        f"Selected spoof:    "
        f"{spoof_count}"
    )

    # -----------------------------------------------------------------------
    # Load models
    # -----------------------------------------------------------------------

    print()
    print("Loading models...")

    wav2vec2 = Wav2Vec2Model(
        str(CHECKPOINT_PATH)
    )

    aasist = AasistModel(
        str(AASIST_CHECKPOINT_PATH)
    )

    ensemble = EnsembleService(
        str(CHECKPOINT_PATH),
        str(AASIST_CHECKPOINT_PATH),
    )

    print("Models loaded.")

    # -----------------------------------------------------------------------
    # Prediction loop
    # -----------------------------------------------------------------------

    y_true = []

    wav2vec2_predictions = []
    aasist_predictions = []
    ensemble_predictions = []

    results = []

    started = time.perf_counter()

    for index, entry in enumerate(
        selected,
        start=1,
    ):

        audio_path = str(
            entry["audio_path"]
        )

        true_label = entry["label"]

        print(
            f"[{index}/{len(selected)}] "
            f"{entry['file_id']} "
            f"({true_label})",
            end="",
            flush=True,
        )

        try:

            wav_result = (
                wav2vec2.predict(
                    audio_path
                )
            )

            aasist_result = (
                aasist.predict(
                    audio_path
                )
            )

            ensemble_result = (
                ensemble.predict(
                    audio_path
                )
            )

            wav_prediction = (
                wav_result["prediction"]
            )

            aasist_prediction = (
                aasist_result["prediction"]
            )

            ensemble_prediction = (
                ensemble_result["prediction"]
            )

            y_true.append(
                true_label
            )

            wav2vec2_predictions.append(
                wav_prediction
            )

            aasist_predictions.append(
                aasist_prediction
            )

            ensemble_predictions.append(
                ensemble_prediction
            )

            results.append(
                {
                    "file_id": entry["file_id"],
                    "true_label": true_label,
                    "wav2vec2_prediction": (
                        wav_prediction
                    ),
                    "wav2vec2_confidence": (
                        wav_result["confidence"]
                    ),
                    "aasist_prediction": (
                        aasist_prediction
                    ),
                    "aasist_confidence": (
                        aasist_result["confidence"]
                    ),
                    "ensemble_prediction": (
                        ensemble_prediction
                    ),
                    "ensemble_confidence": (
                        ensemble_result["confidence"]
                    ),
                }
            )

            print(
                f" -> ensemble="
                f"{ensemble_prediction}"
            )

        except Exception as exc:

            print(
                f" -> ERROR: "
                f"{type(exc).__name__}: "
                f"{exc}"
            )

    elapsed = (
        time.perf_counter()
        - started
    )

    if not y_true:
        raise RuntimeError(
            "No predictions completed successfully."
        )

    # -----------------------------------------------------------------------
    # Metrics
    # -----------------------------------------------------------------------

    print()
    print(
        f"Completed {len(y_true)} predictions "
        f"in {elapsed:.2f}s"
    )

    wav_metrics = print_metrics(
        "Wav2Vec2",
        y_true,
        wav2vec2_predictions,
    )

    aasist_metrics = print_metrics(
        "AASIST",
        y_true,
        aasist_predictions,
    )

    ensemble_metrics = print_metrics(
        "ENSEMBLE",
        y_true,
        ensemble_predictions,
    )

    # -----------------------------------------------------------------------
    # Save results
    # -----------------------------------------------------------------------

    RESULTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    csv_path = (
        RESULTS_DIR
        / "asvspoof_eval_predictions.csv"
    )

    with csv_path.open(
        "w",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=results[0].keys(),
        )

        writer.writeheader()
        writer.writerows(results)

    summary_path = (
        RESULTS_DIR
        / "asvspoof_eval_summary.txt"
    )

    with summary_path.open(
        "w"
    ) as file:

        file.write(
            "PratiDhwani "
            "ASVspoof 2019 LA Evaluation\n"
        )

        file.write(
            "=" * 60
            + "\n\n"
        )

        file.write(
            f"Samples evaluated: "
            f"{len(y_true)}\n"
        )

        file.write(
            f"Runtime seconds: "
            f"{elapsed:.2f}\n\n"
        )

        for name, metrics in (
            (
                "Wav2Vec2",
                wav_metrics,
            ),
            (
                "AASIST",
                aasist_metrics,
            ),
            (
                "Ensemble",
                ensemble_metrics,
            ),
        ):

            file.write(
                f"{name}\n"
            )

            file.write(
                f"Accuracy:  "
                f"{metrics['accuracy']:.6f}\n"
            )

            file.write(
                f"Precision: "
                f"{metrics['precision']:.6f}\n"
            )

            file.write(
                f"Recall:    "
                f"{metrics['recall']:.6f}\n"
            )

            file.write(
                f"F1:        "
                f"{metrics['f1']:.6f}\n"
            )

            file.write(
                f"Confusion Matrix: "
                f"{metrics['confusion_matrix']}\n\n"
            )

    print()
    print("=" * 70)
    print("Evaluation complete.")
    print("=" * 70)

    print()
    print(
        f"Predictions: {csv_path}"
    )

    print(
        f"Summary:     {summary_path}"
    )


if __name__ == "__main__":
    main()