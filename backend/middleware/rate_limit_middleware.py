"""
PratiDhwani
------------
Simple in-memory rate limiting middleware (fixed-window per client IP).

Deliberately dependency-free (no Redis) since a single-process deployment
is the common case here — the counters live in process memory, which
also means they reset on restart and don't share state across multiple
backend replicas. For a multi-instance production deployment, replace
the in-memory store with a shared one (Redis, etc.) behind the same
`RateLimiter` interface.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from backend.core.logging_config import get_logger

logger = get_logger("pratidhwani.rate_limit")


class RateLimiter:
    """Fixed-window counter per key, using a deque of request timestamps."""

    def __init__(self, limit_per_minute: int):
        self.limit = limit_per_minute
        self.window_seconds = 60
        self._requests: dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Returns (allowed, remaining)."""
        now = time.monotonic()
        with self._lock:
            timestamps = self._requests[key]
            cutoff = now - self.window_seconds
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            if len(timestamps) >= self.limit:
                return False, 0

            timestamps.append(now)
            return True, self.limit - len(timestamps)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Applies rate limiting only to the expensive /predict route — health
    checks and static-ish endpoints stay unlimited so monitoring isn't
    affected.
    """

    LIMITED_PATHS = {"/predict"}

    def __init__(self, app, limit_per_minute: int = 30, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled
        self.limiter = RateLimiter(limit_per_minute)

    async def dispatch(self, request: Request, call_next):
        if not self.enabled or request.url.path not in self.LIMITED_PATHS:
            return await call_next(request)

        client_key = request.client.host if request.client else "unknown"
        allowed, remaining = self.limiter.is_allowed(client_key)

        if not allowed:
            logger.warning("rate_limit_exceeded", extra={"client_ip": client_key})
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down and try again shortly."},
                headers={"Retry-After": "60"},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
