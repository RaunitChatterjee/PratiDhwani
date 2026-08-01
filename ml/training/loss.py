"""
PratiDhwani
------------
Loss function.
"""

import torch.nn as nn


def get_loss():

    return nn.CrossEntropyLoss(
        label_smoothing=0.1
    )