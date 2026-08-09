"""
PratiDhwani
------------
Per-request context (currently just the request ID) using `contextvars`,
so it's safely isolated across concurrent async requests and accessible
from anywhere — logging, exception handlers, services — without
threading it through every function signature.
"""

import uuid
from contextvars import ContextVar
from typing import Optional

_request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def new_request_id() -> str:
    return uuid.uuid4().hex[:16]


def set_request_id(request_id: str) -> None:
    _request_id_ctx.set(request_id)


def get_request_id() -> Optional[str]:
    return _request_id_ctx.get()
