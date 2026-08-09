"""
PratiDhwani
------------
Adds standard defensive HTTP response headers to every response. None of
these change response bodies or status codes, so they're safe to add
without touching the API contract.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SecurityHeadersMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, is_production: bool = False):
        super().__init__(app)
        self.is_production = is_production

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "microphone=(), camera=(), geolocation=()"

        if self.is_production:
            # Only meaningful over HTTPS, which is what "production" implies
            # here — harmless but pointless on plain-HTTP local development.
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"

        return response
