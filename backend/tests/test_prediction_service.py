"""Unit tests for backend.services.prediction_service.PredictionService."""

from backend.services.prediction_service import PredictionService


def test_lazy_mode_does_not_load_on_init():
    service = PredictionService("ml/checkpoints/best_model.pt", lazy=True)
    assert service.is_loaded is False


def test_lazy_mode_loads_on_first_predict():
    service = PredictionService("ml/checkpoints/best_model.pt", lazy=True)
    service.predict("fake.wav")
    assert service.is_loaded is True


def test_eager_mode_loads_immediately():
    service = PredictionService("ml/checkpoints/best_model.pt", lazy=False)
    assert service.is_loaded is True


def test_warm_up_forces_load_without_predicting():
    service = PredictionService("ml/checkpoints/best_model.pt", lazy=True)
    assert service.is_loaded is False
    service.warm_up()
    assert service.is_loaded is True


def test_model_status_does_not_trigger_lazy_load():
    service = PredictionService("ml/checkpoints/best_model.pt", lazy=True)
    status = service.model_status()
    assert service.is_loaded is False
    assert any(m["name"] == "wav2vec2" for m in status)


def test_predict_return_shape_unchanged():
    service = PredictionService("ml/checkpoints/best_model.pt", lazy=True)
    result = service.predict("fake.wav")
    assert set(result.keys()) == {"prediction", "confidence", "probabilities"}
    assert set(result["probabilities"].keys()) == {"bonafide", "spoof"}
