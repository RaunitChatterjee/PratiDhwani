"""Unit tests for the PratiDhwani model and ensemble layer."""

import pytest

from backend.models.aasist_model import AasistModel
from backend.models.rawnet2_model import RawNet2Model
from backend.models.wav2vec2_model import Wav2Vec2Model
from backend.services.ensemble_service import EnsembleService


def test_wav2vec2_model_is_implemented_and_active():
    model = Wav2Vec2Model("ml/checkpoints/best_model.pt")

    assert model.is_implemented is True
    assert model.name == "wav2vec2"


def test_wav2vec2_model_predict_uses_mocked_predictor():
    model = Wav2Vec2Model("ml/checkpoints/best_model.pt")

    result = model.predict("fake.wav")

    assert result["prediction"] == "bonafide"
    assert result["probabilities"]["bonafide"] == pytest.approx(
        0.9284
    )


def test_aasist_model_is_implemented_and_active():
    model = AasistModel()

    assert model.is_implemented is True
    assert model.name == "aasist"


def test_rawnet2_model_remains_unimplemented():
    model = RawNet2Model()

    assert model.is_implemented is False


def test_static_model_status():
    status = EnsembleService.static_model_status()

    names = {
        entry["name"]: entry
        for entry in status
    }

    assert names["wav2vec2"]["status"] == "active"
    assert names["wav2vec2"]["implemented"] is True

    assert names["aasist"]["status"] == "active"
    assert names["aasist"]["implemented"] is True

    assert names["rawnet2"]["status"] == "coming_soon"
    assert names["rawnet2"]["implemented"] is False


def test_ensemble_contains_wav2vec2_and_aasist():
    ensemble = EnsembleService(
        "ml/checkpoints/best_model.pt"
    )

    model_names = {
        model.name
        for model in ensemble.models
    }

    assert "wav2vec2" in model_names
    assert "aasist" in model_names
    assert "rawnet2" in model_names


def test_ensemble_predict_uses_multiple_active_models(
    monkeypatch,
):
    """
    Verify that the ensemble actually invokes both implemented models.

    AASIST inference is mocked here because ``fake.wav`` is not a real
    audio file. The purpose of this unit test is to verify ensemble
    orchestration and fusion, not libsndfile/audio decoding.
    """

    def mock_aasist_predict(self, audio_path):
        return {
            "prediction": "bonafide",
            "confidence": 0.80,
            "probabilities": {
                "bonafide": 0.80,
                "spoof": 0.20,
            },
        }

    monkeypatch.setattr(
        AasistModel,
        "predict",
        mock_aasist_predict,
    )

    ensemble = EnsembleService(
        "ml/checkpoints/best_model.pt"
    )

    result = ensemble.predict("fake.wav")

    assert result["prediction"] in {
        "bonafide",
        "spoof",
    }

    assert 0.0 <= result["confidence"] <= 1.0

    assert "probabilities" in result
    assert "fusion" in result
    assert "models" in result

    model_names = {
        model["model"]
        for model in result["models"]
    }

    assert "wav2vec2" in model_names
    assert "aasist" in model_names

    # Both active models must contribute.
    assert len(result["models"]) == 2


def test_ensemble_fusion_contains_expected_weights(
    monkeypatch,
):
    """
    Verify that the configured ensemble weights remain 50/50
    when both Wav2Vec2 and AASIST are active.
    """

    def mock_aasist_predict(self, audio_path):
        return {
            "prediction": "bonafide",
            "confidence": 0.80,
            "probabilities": {
                "bonafide": 0.80,
                "spoof": 0.20,
            },
        }

    monkeypatch.setattr(
        AasistModel,
        "predict",
        mock_aasist_predict,
    )

    ensemble = EnsembleService(
        "ml/checkpoints/best_model.pt"
    )

    result = ensemble.predict("fake.wav")

    weights = result["fusion"]["weights"]

    assert weights["wav2vec2"] == pytest.approx(0.5)
    assert weights["aasist"] == pytest.approx(0.5)


def test_ensemble_probabilities_sum_to_one(
    monkeypatch,
):
    """
    Verify that weighted probability fusion produces a valid
    probability distribution.
    """

    def mock_aasist_predict(self, audio_path):
        return {
            "prediction": "bonafide",
            "confidence": 0.80,
            "probabilities": {
                "bonafide": 0.80,
                "spoof": 0.20,
            },
        }

    monkeypatch.setattr(
        AasistModel,
        "predict",
        mock_aasist_predict,
    )

    ensemble = EnsembleService(
        "ml/checkpoints/best_model.pt"
    )

    result = ensemble.predict("fake.wav")

    probabilities = result["probabilities"]

    assert (
        probabilities["bonafide"]
        + probabilities["spoof"]
    ) == pytest.approx(1.0)


def test_ensemble_raises_if_no_models_are_active(
    monkeypatch,
):
    ensemble = EnsembleService(
        "ml/checkpoints/best_model.pt"
    )

    monkeypatch.setattr(
        ensemble,
        "_active_models",
        lambda: [],
    )

    with pytest.raises(RuntimeError):
        ensemble.predict("fake.wav")