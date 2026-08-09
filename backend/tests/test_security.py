"""Security-focused tests: rate limiting, magic-byte validation, temp
file suffix whitelisting."""

import pytest

from backend.core.upload_validation import is_valid_audio_signature, safe_temp_suffix
from backend.middleware.rate_limit_middleware import RateLimiter


class TestUploadValidation:

    def test_valid_wav_signature_accepted(self):
        header = b"RIFF\x00\x00\x00\x00WAVE"
        assert is_valid_audio_signature(".wav", header) is True

    def test_valid_flac_signature_accepted(self):
        header = b"fLaC" + b"\x00" * 10
        assert is_valid_audio_signature(".flac", header) is True

    def test_wav_extension_with_wrong_content_rejected(self):
        header = b"NOTAWAVFILEXX"
        assert is_valid_audio_signature(".wav", header) is False

    def test_flac_extension_with_wrong_content_rejected(self):
        header = b"RIFF\x00\x00\x00\x00WAVE"
        assert is_valid_audio_signature(".flac", header) is False

    def test_unsupported_extension_always_rejected(self):
        assert is_valid_audio_signature(".mp3", b"ID3" + b"\x00" * 10) is False

    @pytest.mark.parametrize("ext", [".wav", ".flac"])
    def test_safe_temp_suffix_passes_through_known_extensions(self, ext):
        assert safe_temp_suffix(ext) == ext

    @pytest.mark.parametrize("ext", [".exe", ".sh", "../../etc/passwd", ""])
    def test_safe_temp_suffix_rejects_unknown_extensions(self, ext):
        assert safe_temp_suffix(ext) == ".bin"


class TestRateLimiter:

    def test_allows_requests_under_limit(self):
        limiter = RateLimiter(limit_per_minute=5)
        for _ in range(5):
            allowed, _ = limiter.is_allowed("client-a")
            assert allowed is True

    def test_blocks_requests_over_limit(self):
        limiter = RateLimiter(limit_per_minute=3)
        for _ in range(3):
            limiter.is_allowed("client-b")
        allowed, remaining = limiter.is_allowed("client-b")
        assert allowed is False
        assert remaining == 0

    def test_limits_are_independent_per_client(self):
        limiter = RateLimiter(limit_per_minute=2)
        limiter.is_allowed("client-c")
        limiter.is_allowed("client-c")
        allowed_c, _ = limiter.is_allowed("client-c")
        allowed_d, _ = limiter.is_allowed("client-d")
        assert allowed_c is False
        assert allowed_d is True


class TestRateLimitMiddlewareIntegration:

    def test_predict_blocked_after_limit_exceeded(self):
        # Isolated mini ASGI app wrapping only the real middleware under
        # test — avoids depending on the shared `app` singleton's
        # rate-limiter state, which persists across the whole pytest
        # session and would otherwise make this test order-dependent.
        from starlette.applications import Starlette
        from starlette.responses import JSONResponse
        from starlette.routing import Route
        from starlette.testclient import TestClient as StarletteTestClient

        from backend.middleware.rate_limit_middleware import RateLimitMiddleware

        async def predict_stub(request):
            return JSONResponse({"ok": True})

        mini_app = Starlette(routes=[Route("/predict", predict_stub, methods=["POST"])])
        mini_app.add_middleware(RateLimitMiddleware, limit_per_minute=2, enabled=True)
        mini_client = StarletteTestClient(mini_app)

        statuses = [mini_client.post("/predict").status_code for _ in range(4)]

        assert statuses[0] == 200
        assert statuses[1] == 200
        assert 429 in statuses[2:]

    def test_health_endpoint_is_never_rate_limited(self, client):
        for _ in range(50):
            r = client.get("/health")
            assert r.status_code == 200
