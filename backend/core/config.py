"""
PratiDhwani
------------
Centralized configuration.

Every setting has a default that reproduces the exact pre-refactor,
hardcoded behavior — so running with no `.env` file at all behaves
identically to before this stage. `.env` (or real environment variables,
which always take precedence) is the only way to change any of this.
"""

from functools import lru_cache
from typing import List, Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Environment -------------------------------------------------------
    environment: Literal["development", "production", "test"] = "development"

    # --- Server --------------------------------------------------------------
    host: str = "0.0.0.0"
    port: int = 8000

    # --- CORS ------------------------------------------------------------------
    # Matches the two origins that were hardcoded in main.py before this
    # refactor. A comma-separated CORS_ORIGINS env var overrides this list
    # entirely — used in production to allow the real deployed frontend
    # origin instead of localhost.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # --- Model / checkpoint --------------------------------------------------
    # Identical default to the path that was hardcoded in
    # PredictionService before this refactor.
    checkpoint_path: str = "ml/checkpoints/best_model.pt"

    # If true, the model is loaded lazily on the first /predict request
    # instead of at startup. Left unset (None) by default so
    # `effective_warm_start` below can pick a sensible default based on
    # environment; set WARM_START=true/false in .env to force it either way.
    warm_start: bool | None = None

    @property
    def effective_warm_start(self) -> bool:
        """
        Production defaults to eager ("warm") startup so the first real
        request isn't slow; development defaults to lazy loading so
        `uvicorn --reload` cycles stay fast when no audio is being tested.
        An explicit WARM_START=true/false in .env always wins.
        """
        if self.warm_start is not None:
            return self.warm_start
        return self.is_production

    # --- Uploads / security --------------------------------------------------
    max_upload_size_mb: int = 50
    allowed_extensions: str = ".wav,.flac"

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",") if ext.strip()]

    rate_limit_per_minute: int = 30
    rate_limit_enabled: bool = True

    # --- Logging -----------------------------------------------------------------
    log_level: str = "INFO"
    log_dir: str = "logs"

    # --- Docs ------------------------------------------------------------------
    # Swagger/ReDoc are useful in development, commonly disabled in
    # production to avoid exposing schema details publicly.
    enable_docs: bool = True

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Cached so `Settings()` (which reads the environment and `.env`) only
    runs once per process, while still being easy to override in tests via
    `get_settings.cache_clear()` + monkeypatched env vars.
    """
    return Settings()
