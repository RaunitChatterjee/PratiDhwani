# PratiDhwani Backend — FastAPI inference API
#
# Build context MUST be the repository root (not backend/), because the
# app imports `backend.*`, `ml.*`, and `config.*` as top-level packages:
#
#   docker build -f backend/Dockerfile -t pratidhwani-backend .
#
# docker-compose.yml at the repo root is already configured this way.

FROM python:3.11-slim AS base

# --- System dependencies -----------------------------------------------
# libsndfile1 is required by torchaudio/soundfile for .wav/.flac decoding.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python dependencies -------------------------------------------------
# Copied and installed before the rest of the source so dependency layers
# are cached across rebuilds when only application code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Application source ---------------------------------------------------
COPY backend ./backend
COPY ml ./ml
COPY config ./config

# Model checkpoints are large and change independently of code — mounted
# as a volume in docker-compose rather than baked into the image. This
# directory exists so the app has somewhere to look even before the
# volume is mounted.
RUN mkdir -p ml/checkpoints logs

# Non-root user for defense-in-depth.
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
