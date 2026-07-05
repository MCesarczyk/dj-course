# coding: utf-8

"""Zone (Strefa) contracts — child of warehouse."""

from __future__ import annotations

from typing import Optional

from pydantic import Field, StrictStr

from contract.structure_base import StructureModel
from contract.structure_common import StructureStatus


class Zone(StructureModel):
    """Zone response."""

    id: StrictStr
    warehouse_id: StrictStr = Field(alias="warehouseId")
    name: StrictStr
    description: Optional[StrictStr] = None
    status: StructureStatus = StructureStatus.ACTIVE
    aisle_count: Optional[int] = Field(default=None, alias="aisleCount")


class ZoneCreate(StructureModel):
    """POST /warehouses/{warehouseId}/zones body."""

    name: StrictStr
    description: StrictStr


class ZoneUpdate(StructureModel):
    """PATCH /zones/{id} body."""

    name: Optional[StrictStr] = None
    description: Optional[StrictStr] = None
    status: Optional[StructureStatus] = None
