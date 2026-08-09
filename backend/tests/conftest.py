"""
PratiDhwani
------------
Shared pytest fixtures.

Crucially: no real model checkpoint is required to run these tests. The
real `ml.inference.predictor.Predictor` is monkeypatched with a
deterministic mock that has the exact same interface (constructor takes
a checkpoint path, `.predict(audio_path)` returns the same dict shape),
so everything downstream of it — EnsembleService, PredictionService, the
API layer — is exercised for real.
"""

import sys
from pathlib import Path

import pytest

# Make sure the repo root (containing backend/, ml/, config/) is importable
# regardless of where pytest is invoked from.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))


class MockPredictor:
    """Stands in for ml.inference.predictor.Predictor — same interface,
    deterministic output, no real weights required."""

    def __init__(self, checkpoint_path):
        self.checkpoint_path = checkpoint_path

    def predict(self, audio_path):
        return {
            "prediction": "bonafide",
            "confidence": 0.9284,
            "probabilities": {"bonafide": 0.9284, "spoof": 0.0716},
        }


@pytest.fixture(autouse=True)
def mock_predictor(monkeypatch):
    """Applied to every test automatically — nothing in this suite ever
    touches a real checkpoint or runs real inference.

    Patches the name where it's actually used. `backend/models/wav2vec2_model.py`
    does `from ml.inference.predictor import Predictor`, which binds its
    own local reference at import time — patching
    `ml.inference.predictor.Predictor` after that import has already
    happened would silently miss it, since the importing module doesn't
    look the name up dynamically. Patching both locations keeps this
    correct regardless of import order across the test session.
    """
    import ml.inference.predictor as predictor_module
    import backend.models.wav2vec2_model as wav2vec2_model_module

    monkeypatch.setattr(predictor_module, "Predictor", MockPredictor)
    monkeypatch.setattr(wav2vec2_model_module, "Predictor", MockPredictor)
    yield


@pytest.fixture
def valid_wav_bytes():
    # Minimal-but-valid RIFF/WAVE header the magic-byte sniff will accept.
    return b"RIFF" + b"\x00\x00\x00\x00" + b"WAVE" + b"fake pcm body for testing"


@pytest.fixture
def valid_flac_bytes():
    return b"fLaC" + b"\x00" * 40


@pytest.fixture(autouse=True)
def reset_settings_cache():
    """Settings are lru_cache'd; clear between tests so env-var
    monkeypatching in one test doesn't leak into the next."""
    from backend.core.config import get_settings
    from backend.core.dependencies import get_prediction_service

    get_settings.cache_clear()
    get_prediction_service.cache_clear()
    yield
    get_settings.cache_clear()
    get_prediction_service.cache_clear()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from backend.main import app

    return TestClient(app)
