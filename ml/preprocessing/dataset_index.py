"""
PratiDhwani
------------
Create a master dataset index by linking protocol metadata
to the corresponding audio (.flac) files.
"""

from pathlib import Path
import pandas as pd

from config.settings import ASVSPOOF_ROOT

# ------------------------------------------------------------------

METADATA_CSV = Path("ml/metadata/asvspoof_metadata.csv")
OUTPUT_CSV = Path("ml/metadata/dataset_index.csv")

LA_ROOT = ASVSPOOF_ROOT / "LA" / "LA"

SPLIT_FOLDERS = {
    "train": LA_ROOT / "ASVspoof2019_LA_train" / "flac",
    "dev": LA_ROOT / "ASVspoof2019_LA_dev" / "flac",
    "eval": LA_ROOT / "ASVspoof2019_LA_eval" / "flac",
}


def main():

    df = pd.read_csv(METADATA_CSV)

    filepaths = []
    missing = 0

    for _, row in df.iterrows():

        audio_path = (
            SPLIT_FOLDERS[row["split"]]
            / f"{row['filename']}.flac"
        )

        if audio_path.exists():
            filepaths.append(str(audio_path.resolve()))
        else:
            filepaths.append(None)
            missing += 1

    df["filepath"] = filepaths

    df.to_csv(OUTPUT_CSV, index=False)

    print("=" * 60)
    print("Dataset Index Created")
    print("=" * 60)

    print(f"Total Samples : {len(df)}")
    print(f"Missing Files : {missing}")

    print()
    print(df.head())

    print()
    print(f"Saved to: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()