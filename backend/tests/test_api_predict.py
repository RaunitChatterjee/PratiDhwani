"""Integration tests for POST /predict, exercised through the real FastAPI
app + middleware stack (rate limiting, security headers, CORS, logging),
with only the ML checkpoint mocked out."""


def test_predict_valid_wav_returns_original_contract_shape(client, valid_wav_bytes):
    response = client.post("/predict", files={"file": ("clip.wav", valid_wav_bytes, "audio/wav")})

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"prediction", "confidence", "bonafide", "spoof"}
    assert body["prediction"] == "bonafide"
    assert body["confidence"] == 92.84
    assert body["bonafide"] == 92.84
    assert body["spoof"] == 7.16


def test_predict_valid_flac_accepted(client, valid_flac_bytes):
    response = client.post("/predict", files={"file": ("clip.flac", valid_flac_bytes, "audio/flac")})
    assert response.status_code == 200


def test_predict_rejects_unsupported_extension(client, valid_wav_bytes):
    response = client.post("/predict", files={"file": ("clip.mp3", valid_wav_bytes, "audio/mpeg")})
    assert response.status_code == 400
    assert "detail" in response.json()


def test_predict_rejects_empty_file(client):
    response = client.post("/predict", files={"file": ("empty.wav", b"", "audio/wav")})
    assert response.status_code == 400


def test_predict_rejects_oversized_file(client, monkeypatch):
    from backend.core import config as config_module

    config_module.get_settings.cache_clear()
    monkeypatch.setenv("MAX_UPLOAD_SIZE_MB", "1")
    config_module.get_settings.cache_clear()

    oversized = b"RIFF\x00\x00\x00\x00WAVE" + b"0" * (2 * 1024 * 1024)
    response = client.post("/predict", files={"file": ("big.wav", oversized, "audio/wav")})
    assert response.status_code == 413


def test_predict_rejects_spoofed_extension_via_magic_bytes(client):
    fake_content = b"NOT A REAL WAV FILE" + b"\x00" * 40
    response = client.post("/predict", files={"file": ("clip.wav", fake_content, "audio/wav")})
    assert response.status_code == 400
    assert "content" in response.json()["detail"].lower()


def test_predict_response_includes_request_id_header(client, valid_wav_bytes):
    response = client.post("/predict", files={"file": ("clip.wav", valid_wav_bytes, "audio/wav")})
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 0


def test_predict_propagates_client_supplied_request_id(client, valid_wav_bytes):
    response = client.post(
        "/predict",
        files={"file": ("clip.wav", valid_wav_bytes, "audio/wav")},
        headers={"X-Request-ID": "custom-trace-id-123"},
    )
    assert response.headers["X-Request-ID"] == "custom-trace-id-123"


def test_predict_inference_failure_returns_500_not_stacktrace(client, valid_wav_bytes, monkeypatch):
    import backend.models.wav2vec2_model as wav2vec2_model_module

    class FailingPredictor:
        def __init__(self, checkpoint_path):
            pass

        def predict(self, audio_path):
            raise RuntimeError("simulated inference crash")

    # Patch where the name is actually used (wav2vec2_model.py did
    # `from ml.inference.predictor import Predictor`), not at its origin.
    monkeypatch.setattr(wav2vec2_model_module, "Predictor", FailingPredictor)

    from backend.core.dependencies import get_prediction_service
    get_prediction_service.cache_clear()

    response = client.post("/predict", files={"file": ("clip.wav", valid_wav_bytes, "audio/wav")})
    assert response.status_code == 500
    assert "simulated inference crash" not in response.text
