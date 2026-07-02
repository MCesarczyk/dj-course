# coding: utf-8

"""Shared error response contract.

Every route returns ``{"error": "..."}`` on a handled failure (400/404/409/500).
This is the single model those responses are documented against in the
generated OpenAPI contract.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error envelope."""

    error: str = Field(description='Human-readable error message')
