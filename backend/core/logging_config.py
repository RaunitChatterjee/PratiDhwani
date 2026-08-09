"""
PratiDhwani
------------
Structured logging configuration.

Produces JSON log lines (one object per line) to both stdout and a
rotating log file, so logs are equally usable for local `tail -f`
debugging and for ingestion by a log aggregator in production. Every
record automatically includes a request ID when one is available (see
`backend.core.request_context`), without call sites needing to pass it
explicitly.
"""

import json
import logging
import logging.handlers
import sys
from pathlib import Path

from backend.core.request_context import get_request_id

_CONFIGURED = False


class JSONFormatter(logging.Formatter):
    """Renders each log record as a single-line JSON object."""

    # NOTE: this list determines what gets merged into the JSON payload —
    # but Python's own `logging` module ALSO reserves these names when
    # constructing a LogRecord and raises a KeyError if `extra=` contains
    # one of them, before this formatter ever runs. Never pass extra=
    # keys named e.g. "filename", "module", or "message" anywhere in this
    # codebase — use a distinguishing prefix instead (e.g.
    # "uploaded_filename").
    RESERVED = {
        "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
        "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
        "created", "msecs", "relativeCreated", "thread", "threadName",
        "processName", "process", "message", "taskName",
    }

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
        }

        # Any extra=... fields passed to the logging call get merged in.
        for key, value in record.__dict__.items():
            if key not in self.RESERVED and not key.startswith("_"):
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def configure_logging(log_level: str = "INFO", log_dir: str = "logs") -> None:
    """
    Idempotent — safe to call multiple times (e.g. once from app startup,
    once from a test fixture) without duplicating handlers.
    """
    global _CONFIGURED
    if _CONFIGURED:
        return

    Path(log_dir).mkdir(parents=True, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())
    root_logger.handlers.clear()

    formatter = JSONFormatter()

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 10MB per file, 5 rotated backups kept — bounded disk usage without
    # needing an external log-rotation cron job.
    file_handler = logging.handlers.RotatingFileHandler(
        filename=str(Path(log_dir) / "app.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Dedicated error log — separate file so operational alerting can
    # tail just this one without noisy INFO-level traffic.
    error_handler = logging.handlers.RotatingFileHandler(
        filename=str(Path(log_dir) / "error.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

    # Quiet down noisy third-party loggers at DEBUG-adjacent levels.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
