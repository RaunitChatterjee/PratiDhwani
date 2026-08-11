"""Integration tests for GET / and GET /health."""


def test_root_endpoint(client):
    response = client.get("/")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "online"
    assert body["service"] == "PratiDhwani API"


def test_health_endpoint_preserves_original_fields(client):
    response = client.get("/health")

    assert response.status_code == 200

    body = response.json()

    # Original fields the frontend's health panel already depends on —
    # must always be present with these exact keys.
    for key in (
        "status",
        "service",
        "version",
        "model_loaded",
        "model_name",
        "device",
        "torch_version",
        "transformers_version",
        "uptime_seconds",
    ):
        assert key in body, (
            f"missing original field: {key}"
        )

    assert body["status"] == "healthy"
    assert body["model_name"] == (
        "Wav2Vec2 Deepfake Detector"
    )


def test_health_endpoint_new_additive_fields(client):
    response = client.get("/health")

    assert response.status_code == 200

    body = response.json()

    assert "models" in body

    assert set(body["models"].keys()) == {
        "wav2vec2_loaded",
        "aasist_loaded",
        "rawnet2_loaded",
    }

    assert body["models"]["wav2vec2_loaded"] is True

    # AASIST is now a real implemented model.
    assert body["models"]["aasist_loaded"] is True

    # RawNet2 is still a placeholder.
    assert body["models"]["rawnet2_loaded"] is False

    assert "ensemble_ready" in body


def test_health_does_not_force_model_load(client):
    """
    /health must stay cheap under lazy loading — it should never
    instantiate the model just to answer a status check.
    """

    from backend.core.dependencies import (
        get_prediction_service,
    )

    client.get("/health")

    service = get_prediction_service()

    # In test/dev config (lazy, no prior /predict call in this test),
    # the model must still be unloaded.
    assert service.is_loaded is False


def test_health_reports_security_headers(client):
    response = client.get("/health")

    assert response.headers.get(
        "X-Content-Type-Options"
    ) == "nosniff"

    assert response.headers.get(
        "X-Frame-Options"
    ) == "DENY"