import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

from ml.preprocessing.audio_dataset import ASVspoofDataset

dataset = ASVspoofDataset(
    "ml/metadata/dataset_index.csv"
)

print("=" * 60)
print("Dataset Loaded")
print("=" * 60)

print("Total samples:", len(dataset))

sample = dataset[0]

print()

print("Filename :", sample["filename"])
print("Attack   :", sample["attack"])
print("Label    :", sample["label"])
print("Shape    :", sample["waveform"].shape)