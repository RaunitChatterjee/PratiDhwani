"""
PratiDhwani
------------
RawNet2 model adapter — NOT YET IMPLEMENTED.

Reserved for a future RawNet2-based spoof detector. Mirrors
`AasistModel`: registered with the ensemble, reports
`is_implemented = False`, and `predict()` raises rather than fabricating
a result. See `aasist_model.py` for the full rationale.
"""

from typing import Any, Dict

from backend.models.base_model import BaseModel, ModelNotImplementedError


class RawNet2Model(BaseModel):

    name = "rawnet2"
    is_implemented = False

    def __init__(self):
        # No checkpoint, no weights, no preprocessing pipeline yet.
        pass

    def predict(self, audio_path: str) -> Dict[str, Any]:
        raise ModelNotImplementedError(
            "RawNet2 model is not yet implemented. This is a placeholder "
            "reserved for a future release of PratiDhwani's multi-model "
            "ensemble and must not be invoked for real predictions."
        )
