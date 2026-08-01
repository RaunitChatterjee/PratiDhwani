"""
PratiDhwani
------------
Validation loop.
"""

import torch

from ml.training.metrics import compute_metrics


def validate(model, loader, criterion, device):

    model.eval()

    losses = []

    predictions = []
    labels = []

    with torch.no_grad():

        for batch in loader:

            # Validation loop will be completed
            # after batching is implemented.
            pass

    return {
        "loss": 0.0,
        "metrics": {},
    }