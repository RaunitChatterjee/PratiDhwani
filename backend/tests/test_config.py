"""Unit tests for backend.core.config."""

from backend.core.config import Settings


def test_default_settings_reproduce_original_hardcoded_behavior():
    settings = Settings(_env_file=None)
    assert settings.checkpoint_path == "ml/checkpoints/best_model.pt"
    assert settings.cors_origins_list == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    assert settings.allowed_extensions_list == [".wav", ".flac"]


def test_cors_origins_parses_comma_separated_list():
    settings = Settings(_env_file=None, cors_origins="https://a.com, https://b.com")
    assert settings.cors_origins_list == ["https://a.com", "https://b.com"]


def test_warm_start_defaults_to_environment_when_unset():
    dev_settings = Settings(_env_file=None, environment="development")
    prod_settings = Settings(_env_file=None, environment="production")
    assert dev_settings.effective_warm_start is False
    assert prod_settings.effective_warm_start is True


def test_explicit_warm_start_overrides_environment_default():
    settings = Settings(_env_file=None, environment="production", warm_start=False)
    assert settings.effective_warm_start is False


def test_is_production_flag():
    assert Settings(_env_file=None, environment="production").is_production is True
    assert Settings(_env_file=None, environment="development").is_production is False
