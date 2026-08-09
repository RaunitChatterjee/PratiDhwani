# API Reference

Base URL (local dev): `http://127.0.0.1:8000`

Interactive docs (when `ENABLE_DOCS=true`): `/docs` (Swagger) and `/redoc`.

---

## `POST /predict`

Analyzes an uploaded audio recording and returns a deepfake-detection verdict.

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | yes | `.wav` or `.flac`. Max size: `MAX_UPLOAD_SIZE_MB` (default 50 MB). |

**Response `200`:**

```json
{
  "prediction": "bonafide",
  "confidence": 92.84,
  "bonafide": 92.84,
  "spoof": 7.16
}
```

This shape is unchanged from the original implementation — `confidence`/`bonafide`/`spoof` are percentages (0–100).

**Response headers:**

| Header | Meaning |
|---|---|
| `X-Request-ID` | Correlates this request with server-side logs. Echoes a client-supplied `X-Request-ID` if one was sent. |
| `X-Process-Time-Ms` | Total server-side handling time. |
| `X-RateLimit-Remaining` | Requests remaining in the current window. |

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Missing/unsupported extension, empty file, or file content doesn't match its claimed extension (magic-byte check). |
| `413` | File exceeds `MAX_UPLOAD_SIZE_MB`. |
| `429` | Rate limit exceeded (`RATE_LIMIT_PER_MINUTE`, default 30/min per client). |
| `500` | Inference or unexpected server error. Message is generic; details are in server-side logs keyed by `X-Request-ID`. |

All error responses use FastAPI's standard `{"detail": "..."}` shape.

---

## `GET /health`

**Response `200`:**

```json
{
  "status": "healthy",
  "service": "PratiDhwani API",
  "version": "1.0.0",
  "environment": "development",

  "model_loaded": true,
  "model_name": "Wav2Vec2 Deepfake Detector",
  "device": "cpu",
  "torch_version": "2.5.1",
  "transformers_version": "4.47.1",
  "uptime_seconds": 128.4,

  "models": {
    "wav2vec2_loaded": true,
    "aasist_loaded": false,
    "rawnet2_loaded": false
  },
  "ensemble_ready": true,

  "memory_usage_mb": 812.3,
  "cpu_percent": 2.1
}
```

The first block of fields (`model_loaded` through `uptime_seconds`) is unchanged from the original implementation. The `models`/`ensemble_ready`/`memory_usage_mb`/`cpu_percent` fields are new and additive — existing consumers reading only the original fields are unaffected.

Never rate-limited. Never triggers a model load under lazy-loading configuration — it's always cheap to poll.

---

## `GET /`

Liveness probe. Returns `{"status": "online", "service": "PratiDhwani API", "version": "..."}`.
