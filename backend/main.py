"""
PratiDhwani
------------
FastAPI Application
"""

import time
from contextlib import asynccontextmanager

import torch
import transformers
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.predict import router as predict_router
from backend.core.config import get_settings
from backend.core.dependencies import get_prediction_service
from backend.core.logging_config import configure_logging, get_logger
from backend.core.request_context import get_request_id
from backend.middleware.rate_limit_middleware import RateLimitMiddleware
from backend.middleware.request_context_middleware import RequestContextMiddleware
from backend.middleware.security_headers_middleware import SecurityHeadersMiddleware

settings = get_settings()
configure_logging(log_level=settings.log_level, log_dir=settings.log_dir)
logger = get_logger("pratidhwani.main")

START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    logger.info(
        "app_startup",
        extra={
            "environment": settings.environment,
            "warm_start": settings.effective_warm_start,
            "cors_origins": settings.cors_origins_list,
        },
    )
    if settings.effective_warm_start:
        prediction_service = get_prediction_service()
        prediction_service.warm_up()
        logger.info("model_warm_start_complete")
    else:
        logger.info("model_lazy_load_enabled")

    yield

    # --- shutdown ---
    logger.info("app_shutdown", extra={"uptime_seconds": round(time.time() - START_TIME, 2)})


app = FastAPI(
    title="PratiDhwani API",
    description="AI-powered Deepfake Speech Detection",
    version="1.0.0",
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    lifespan=lifespan,
)

# Middleware executes outermost-last-added-first on the way in. Ordering
# here: security headers and rate limiting are innermost (closest to the
# route), CORS next, request-context/logging outermost so every request
# gets a request ID before anything else runs.
app.add_middleware(SecurityHeadersMiddleware, is_production=settings.is_production)
app.add_middleware(
    RateLimitMiddleware,
    limit_per_minute=settings.rate_limit_per_minute,
    enabled=settings.rate_limit_enabled,
)

# Allow the React frontend to access the API. Origins now come from
# config (CORS_ORIGINS in .env) instead of being hardcoded — the default
# reproduces the exact two origins that were hardcoded before this change.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID assignment + structured access logging for every request.
app.add_middleware(RequestContextMiddleware)

app.include_router(predict_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for anything that escapes route-level handling. Logs the
    full traceback server-side (with the request ID for correlation) but
    returns a generic message to the client — never leaks internals.
    Uses the same {"detail": ...} shape FastAPI's own HTTPException
    handler produces, so the frontend's existing error parsing needs no
    changes.
    """
    logger.exception(
        "unhandled_exception",
        extra={"path": request.url.path, "method": request.method},
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
        headers={"X-Request-ID": get_request_id() or ""},
    )


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "PratiDhwani API",
        "version": app.version,
    }


@app.get("/health")
def health():
    prediction_service = get_prediction_service()
    model_status = prediction_service.model_status()
    wav2vec2_status = next((m for m in model_status if m["name"] == "wav2vec2"), None)
    aasist_status = next((m for m in model_status if m["name"] == "aasist"), None)
    rawnet2_status = next((m for m in model_status if m["name"] == "rawnet2"), None)

    memory_info = {}
    try:
        import psutil

        process = psutil.Process()
        memory_info = {
            "memory_usage_mb": round(process.memory_info().rss / (1024 * 1024), 2),
            "cpu_percent": process.cpu_percent(interval=0.05),
        }
    except ImportError:
        # psutil is an optional nicety — its absence shouldn't break /health.
        pass

    return {
        "status": "healthy",
        "service": "PratiDhwani API",
        "version": app.version,
        "environment": settings.environment,
        # Existing fields, unchanged, since the frontend's health panel
        # already depends on these exact keys.
        "model_loaded": prediction_service.is_loaded or settings.effective_warm_start,
        "model_name": "Wav2Vec2 Deepfake Detector",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "torch_version": torch.__version__,
        "transformers_version": transformers.__version__,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        # New, additive fields for the multi-model ensemble.
        "models": {
            "wav2vec2_loaded": bool(wav2vec2_status and wav2vec2_status["implemented"]),
            "aasist_loaded": bool(aasist_status and aasist_status["implemented"]),
            "rawnet2_loaded": bool(rawnet2_status and rawnet2_status["implemented"]),
        },
        "ensemble_ready": prediction_service.is_loaded or settings.effective_warm_start,
        **memory_info,
    }
