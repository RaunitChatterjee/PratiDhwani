"""
PratiDhwani
------------
Optimizer utilities.
"""

import torch.optim as optim


def get_optimizer(model, lr):

    return optim.AdamW(
        model.parameters(),
        lr=lr,
        weight_decay=1e-4,
    ) 