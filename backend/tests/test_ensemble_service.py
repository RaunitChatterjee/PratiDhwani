"""Unit tests for the ensemble/model layer (BaseModel, Wav2Vec2Model,
placeholders, EnsembleService)."""

import pytest

from backend.models.aasist_model import AasistModel
from backend.models.base_model import ModelNotImplementedError
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
    assert result["probabilities"]["bonafide"] == pytest.approx(0.9284)


@pytest.mark.parametrize("PlaceholderModel", [AasistModel, RawNet2Model])
def test_placeholder_models_report_not_implemented(PlaceholderModel):
    model = PlaceholderModel()
    assert model.is_implemented is False


@pytest.mark.parametrize("PlaceholderModel", [AasistModel, RawNet2Model])
def test_placeholder_models_raise_rather_than_fabricate(PlaceholderModel):
    model = PlaceholderModel()
    with pytest.raises(ModelNotImplementedError):
        model.predict("fake.wav")


def test_ensemble_service_static_model_status_no_instantiation_needed():
    status = EnsembleService.static_model_status()
    names = {entry["name"]: entry for entry in status}

    assert names["wav2vec2"]["status"] == "active"
    assert names["wav2vec2"]["implemented"] is True
    assert names["aasist"]["status"] == "coming_soon"
    assert names["aasist"]["implemented"] is False
    assert names["rawnet2"]["status"] == "coming_soon"


def test_ensemble_predict_matches_wav2vec2_output_exactly():
    ensemble = EnsembleService("ml/checkpoints/best_model.pt")
    direct = Wav2Vec2Model("ml/checkpoints/best_model.pt").predict("fake.wav")
    via_ensemble = ensemble.predict("fake.wav")

    # This is the core "unchanged behavior" guarantee: with only Wav2Vec2
    # implemented, the ensemble is a pure pass-through.
    assert via_ensemble == direct


def test_ensemble_raises_if_no_models_are_active(monkeypatch):
    ensemble = EnsembleService("ml/checkpoints/best_model.pt")
    monkeypatch.setattr(ensemble, "_active_models", lambda: [])

    with pytest.raises(RuntimeError):
        ensemble.predict("fake.wav")
