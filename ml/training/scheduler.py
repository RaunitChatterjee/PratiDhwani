"""
PratiDhwani
------------
Learning rate scheduler.
"""

from transformers import get_cosine_schedule_with_warmup


def get_scheduler(
    optimizer,
    warmup_steps,
    total_steps,
):

    scheduler = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps,
    )

    return scheduler