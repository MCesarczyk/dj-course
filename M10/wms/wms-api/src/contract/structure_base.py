# coding: utf-8

"""Shared base for warehouse-structure contracts.

Unlike the OpenAPI-generated contracts in this package, the structure CRUD
models are hand-authored. They share a thin base that mirrors the generated
public interface (`from_dict` / `to_dict` / `from_json` / `to_json`) so routes
read the same way as the rest of the codebase, while keeping the per-model
definitions small.

The matching OpenAPI definitions live in `openapi.yaml`
(components.schemas, `Warehouse*` / `Zone*` / `Aisle*` / `Rack*` / `Shelf*`).
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict
from typing_extensions import Self


class StructureModel(BaseModel):
    """Base model: camelCase wire format, snake_case in Python."""

    model_config = ConfigDict(
        populate_by_name=True,
        validate_assignment=True,
        protected_namespaces=(),
        extra="ignore",
    )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize using camelCase aliases, dropping unset None fields."""
        return self.model_dump(by_alias=True, exclude_none=True)

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, obj: Optional[Dict[str, Any]]) -> Optional[Self]:
        if obj is None:
            return None
        return cls.model_validate(obj)

    @classmethod
    def from_json(cls, json_str: str) -> Optional[Self]:
        return cls.from_dict(json.loads(json_str))
