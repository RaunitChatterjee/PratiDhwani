"""
PratiDhwani
------------
Assigns a request ID to every incoming request (reusing an
`X-Request-ID` header from the caller if present, e.g. from a load
balancer or API gateway), stores it in request-scoped context so every
log line emitted while handling the request carries it, and echoes it
back on the response so client-side logs/error reports can be correlated
with server-side ones.
"""

import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from backend.core.request_context import new_request_id, set_request_id
from backend.core.logging_config import get_logger

logger = get_logger("pratidhwani.request")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Combines request-ID assignment and access logging with timing."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or new_request_id()
        set_request_id(request_id)

        started_at = time.perf_counter()

        logger.info(
            "request_started",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else None,
            },
        )

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
            logger.exception(
                "request_failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(duration_ms)

        logger.info(
            "request_completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )

        return response
