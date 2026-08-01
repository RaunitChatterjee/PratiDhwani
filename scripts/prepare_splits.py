"""
PratiDhwani
------------
Generate train/dev/eval CSVs from dataset_index.csv.
"""

from pathlib import Path
import pandas as pd

METADATA_DIR = Path("ml/metadata")

INPUT_CSV = METADATA_DIR / "dataset_index.csv"

TRAIN_CSV = METADATA_DIR / "train.csv"
DEV_CSV = METADATA_DIR / "dev.csv"
EVAL_CSV = METADATA_DIR / "eval.csv"


def main():

    df = pd.read_csv(INPUT_CSV)

    train_df = df[df["split"] == "train"].reset_index(drop=True)
    dev_df = df[df["split"] == "dev"].reset_index(drop=True)
    eval_df = df[df["split"] == "eval"].reset_index(drop=True)

    train_df.to_csv(TRAIN_CSV, index=False)
    dev_df.to_csv(DEV_CSV, index=False)
    eval_df.to_csv(EVAL_CSV, index=False)

    print("=" * 60)
    print("Dataset Split Summary")
    print("=" * 60)

    print(f"Train : {len(train_df)}")
    print(f"Dev   : {len(dev_df)}")
    print(f"Eval  : {len(eval_df)}")

    print("\nSaved:")
    print(TRAIN_CSV)
    print(DEV_CSV)
    print(EVAL_CSV)


if __name__ == "__main__":
    main()