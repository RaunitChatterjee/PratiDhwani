"""
PratiDhwani
------------
Create small train/dev splits for rapid debugging.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

import pandas as pd

METADATA_DIR = Path("ml/metadata")

train = pd.read_csv(METADATA_DIR / "train.csv")
dev = pd.read_csv(METADATA_DIR / "dev.csv")

# Random but reproducible
train_small = train.sample(
    n=1000,
    random_state=42,
).reset_index(drop=True)

dev_small = dev.sample(
    n=200,
    random_state=42,
).reset_index(drop=True)

train_small.to_csv(
    METADATA_DIR / "train_small.csv",
    index=False,
)

dev_small.to_csv(
    METADATA_DIR / "dev_small.csv",
    index=False,
)

print("=" * 60)
print("Debug splits created")
print("=" * 60)
print(f"Train : {len(train_small)}")
print(f"Dev   : {len(dev_small)}")