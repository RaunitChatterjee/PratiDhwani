"""
PratiDhwani
------------
Wav2Vec2 model adapter.

This module deliberately does NOT reimplement preprocessing, feature
extraction, checkpoint loading, or inference logic. All of that continues
to live exactly where it already did — in `ml.inference.predictor.Predictor`
(which itself uses the existing `AudioProcessor`, `Wav2VecProcessor`, and
`Wav2VecDetector`) — completely untouched by this refactor.

`Wav2Vec2Model` is only a thin adapter that makes the existing Predictor
conform to `BaseModel`, so `EnsembleService` can treat it the same way it
will eventually treat AASIST and RawNet2. Preprocessing, checkpoint path
handling, label mapping ("bonafide"/"spoof"), and output values are all
byte-for-byte identical to the pre-refactor behavior.
"""

from typing import Any, Dict

from backend.models.base_model import BaseModel
from ml.inference.predictor import Predictor


class Wav2Vec2Model(BaseModel):

    name = "wav2vec2"
    is_implemented = True

    def __init__(self, checkpoint_path: str = "ml/checkpoints/best_model.pt"):
        # Unchanged: same Predictor class, same checkpoint path default,
        # same preprocessing pipeline as before this refactor.
        self._predictor = Predictor(checkpoint_path)

    def predict(self, audio_path: str) -> Dict[str, Any]:
        # Delegates directly to the original, untouched predict() method —
        # no re-implementation, no altered preprocessing, no changed
        # thresholds or label mapping.
        return self._predictor.predict(audio_path)
