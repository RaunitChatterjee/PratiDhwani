"""
PratiDhwani
------------
AASIST model adapter — NOT YET IMPLEMENTED.

Reserved for a future AASIST-based spoof detector. It's registered with
the ensemble now, reporting `is_implemented = False`, so the rest of the
system (EnsembleService, the `/health` and Model Results surfaces) can
already know about it without any special-casing. `predict()` intentionally
raises rather than returning a fabricated or fallback result — the
ensemble is responsible for skipping unimplemented models rather than
silently substituting a fake score.
"""

from typing import Any, Dict

from backend.models.base_model import BaseModel, ModelNotImplementedError


class AasistModel(BaseModel):

    name = "aasist"
    is_implemented = False

    def __init__(self):
        # No checkpoint, no weights, no preprocessing pipeline yet.
        pass

    def predict(self, audio_path: str) -> Dict[str, Any]:
        raise ModelNotImplementedError(
            "AASIST model is not yet implemented. This is a placeholder "
            "reserved for a future release of PratiDhwani's multi-model "
            "ensemble and must not be invoked for real predictions."
        )
