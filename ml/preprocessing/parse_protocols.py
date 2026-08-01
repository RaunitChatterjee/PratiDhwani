"""
PratiDhwani
------------
Parse ASVspoof2019 LA protocol files and create a unified CSV index.
"""

from pathlib import Path
import pandas as pd

from config.settings import ASVSPOOF_ROOT


LA_ROOT = ASVSPOOF_ROOT / "LA" / "LA"

PROTOCOL_DIR = LA_ROOT / "ASVspoof2019_LA_cm_protocols"

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "metadata"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_CSV = OUTPUT_DIR / "asvspoof_metadata.csv"


PROTOCOL_FILES = {
    "train": "ASVspoof2019.LA.cm.train.trn.txt",
    "dev": "ASVspoof2019.LA.cm.dev.trl.txt",
    "eval": "ASVspoof2019.LA.cm.eval.trl.txt",
}


def parse_protocol(split, protocol_file):

    rows = []

    protocol_path = PROTOCOL_DIR / protocol_file

    with open(protocol_path, "r") as f:

        for line in f:

            parts = line.strip().split()

            speaker_id = parts[0]
            filename = parts[1]
            attack = parts[3]
            label = parts[4]

            rows.append(
                {
                    "split": split,
                    "speaker": speaker_id,
                    "filename": filename,
                    "attack": attack,
                    "label": label,
                }
            )

    return rows


def main():

    all_rows = []

    for split, file in PROTOCOL_FILES.items():
        all_rows.extend(parse_protocol(split, file))

    df = pd.DataFrame(all_rows)

    df.to_csv(OUTPUT_CSV, index=False)

    print("=" * 60)
    print("ASVspoof Metadata Created")
    print("=" * 60)
    print(df.head())
    print()
    print(df["label"].value_counts())
    print()
    print(f"Saved to: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()