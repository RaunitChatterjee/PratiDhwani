"""
PratiDhwani
------------
PyTorch DataLoader utilities.
"""

from torch.utils.data import DataLoader

from ml.preprocessing.audio_dataset import ASVspoofDataset


def collate_fn(batch):
    return batch


def get_dataloader(csv_path, batch_size=8, shuffle=True):

    dataset = ASVspoofDataset(csv_path)

    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        collate_fn=collate_fn,
    )

    return loader