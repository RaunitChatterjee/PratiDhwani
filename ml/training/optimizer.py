"""
PratiDhwani
------------
Optimizer utilities.
"""

import torch.optim as optim


def get_optimizer(model, lr):

    optimizer = optim.AdamW(
        model.parameters(),
        lr=lr,
        weight_decay=0.01,
        betas=(0.9, 0.98),
    )

    return optimizer