"""
PratiDhwani
------------
Create balanced debug train/dev splits.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

import pandas as pd

METADATA_DIR = Path("ml/metadata")

TRAIN_SIZE = 1000
DEV_SIZE = 200

train = pd.read_csv(METADATA_DIR / "train.csv")
dev = pd.read_csv(METADATA_DIR / "dev.csv")


def balanced_sample(df, total_samples):

    samples_per_class = total_samples // 2

    bonafide = (
        df[df["label"] == "bonafide"]
        .sample(
            n=samples_per_class,
            random_state=42,
        )
    )

    spoof = (
        df[df["label"] == "spoof"]
        .sample(
            n=samples_per_class,
            random_state=42,
        )
    )

    balanced = (
        pd.concat([bonafide, spoof])
        .sample(frac=1, random_state=42)
        .reset_index(drop=True)
    )

    return balanced


train_small = balanced_sample(train, TRAIN_SIZE)
dev_small = balanced_sample(dev, DEV_SIZE)

train_small.to_csv(
    METADATA_DIR / "train_small.csv",
    index=False,
)

dev_small.to_csv(
    METADATA_DIR / "dev_small.csv",
    index=False,
)

print("=" * 60)
print("Balanced Debug Splits Created")
print("=" * 60)

print()

print(train_small["label"].value_counts())

print()

print(dev_small["label"].value_counts())