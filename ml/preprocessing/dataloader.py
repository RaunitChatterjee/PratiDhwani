"""
PratiDhwani
------------
PyTorch DataLoader utilities.
"""

from torch.utils.data import DataLoader

from ml.datasets.audio_dataset import ASVspoofDataset
from ml.preprocessing.collator import Wav2VecCollator


def get_dataloader(
    csv_path,
    batch_size=8,
    shuffle=True,
):

    dataset = ASVspoofDataset(csv_path)

    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        collate_fn=Wav2VecCollator(),
        pin_memory=False,
    )

    return loader