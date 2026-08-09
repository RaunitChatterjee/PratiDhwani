# Architecture

## System overview

```
┌─────────────────────┐         HTTPS / JSON          ┌──────────────────────────────┐
│   React Frontend      │  ───────────────────────────▶  │   FastAPI Backend              │
│   (Vite, nginx)        │  ◀───────────────────────────  │   (uvicorn)                     │
│                        │      POST /predict              │                                │
│  - Upload UI            │      GET  /health                │  ┌──────────────────────────┐ │
│  - Waveform playback      │                                │  │ Middleware stack          │ │
│  - Forensic report/PDF  │                                │  │  RequestContext (log/ID)  │ │
│  - Model Results panel  │                                │  │  CORS                     │ │
└─────────────────────┘                                │  │  RateLimit                │ │
                                                         │  │  SecurityHeaders          │ │
                                                         │  └──────────────────────────┘ │
                                                         │              │                 │
                                                         │              ▼                 │
                                                         │  ┌──────────────────────────┐ │
                                                         │  │  PredictionService          │ │
                                                         │  │  (lazy/warm singleton)    │ │
                                                         │  └──────────────┬───────────┘ │
                                                         │                 ▼               │
                                                         │  ┌──────────────────────────┐ │
                                                         │  │  EnsembleService            │ │
                                                         │  │  (registers all models)   │ │
                                                         │  └──┬───────────┬───────────┘ │
                                                         │     ▼           ▼               │
                                                         │  Wav2Vec2Model  AasistModel     │
                                                         │  (active)       RawNet2Model    │
                                                         │     │           (placeholders,  │
                                                         │     ▼            raise cleanly) │
                                                         │  ml/inference/predictor.py       │
                                                         │  (unchanged preprocessing/       │
                                                         │   inference pipeline)            │
                                                         └──────────────────────────────┘
```

## Package layout and responsibilities

| Package | Responsibility |
|---|---|
| `backend/api/` | HTTP route handlers. Thin — validates input, delegates to services, shapes the response. |
| `backend/core/` | Cross-cutting infrastructure: config, logging, request context, DI, upload validation. |
| `backend/middleware/` | ASGI middleware: request ID/logging, rate limiting, security headers. |
| `backend/models/` | `BaseModel` interface and one adapter per detection model (Wav2Vec2 active; AASIST/RawNet2 placeholders). |
| `backend/services/` | Orchestration: `EnsembleService` coordinates registered models, `PredictionService` adds lazy/warm loading on top. |
| `backend/schemas/` | Pydantic request/response models — the `/predict` contract. |
| `ml/` | The actual ML pipeline (preprocessing, feature extraction, model, checkpoint loading). Untouched by every refactor described in this repo's history — `backend/models/wav2vec2_model.py` only wraps it. |
| `config/` | Shared low-level constants (`DEVICE`, `SAMPLE_RATE`, `BASE_MODEL`) consumed by `ml/`. Distinct from `backend/core/config.py`, which is the backend service's own settings. |

## Request lifecycle (`POST /predict`)

1. `RequestContextMiddleware` assigns a request ID, logs `request_started`.
2. `RateLimitMiddleware` checks the caller's request count for this route.
3. `SecurityHeadersMiddleware` will annotate the eventual response.
4. `CORSMiddleware` validates the request origin.
5. `backend/api/predict.py`:
   - Rejects unsupported extensions.
   - Streams the upload to a temp file, enforcing the size cap while writing.
   - Validates the file's magic bytes match its claimed extension.
   - Calls `PredictionService.predict()`.
6. `PredictionService` lazily loads (or reuses) the `EnsembleService`.
7. `EnsembleService` calls the one active model (`Wav2Vec2Model`), which delegates to the original, unmodified `ml.inference.predictor.Predictor`.
8. The response is shaped into the original `{prediction, confidence, bonafide, spoof}` contract.
9. The temp file is deleted in a `finally` block regardless of outcome.
10. `RequestContextMiddleware` logs `request_completed` with duration, and echoes `X-Request-ID` back to the caller.

## Why the multi-model layer exists but only Wav2Vec2 runs

`EnsembleService` registers every model class (`Wav2Vec2Model`, `AasistModel`, `RawNet2Model`) so the interface is stable regardless of which models actually have trained weights. `AasistModel`/`RawNet2Model` report `is_implemented = False` and raise `ModelNotImplementedError` if ever called directly — the ensemble filters to only "active" models before predicting, so today's prediction path is a pure pass-through to Wav2Vec2. Nothing here fabricates a second opinion; there isn't one yet.
