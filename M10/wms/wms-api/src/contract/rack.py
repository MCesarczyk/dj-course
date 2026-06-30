# coding: utf-8

"""Rack (Szafa) contracts — child of aisle."""

from __future__ import annotations

from typing import Optional

from pydantic import Field, StrictInt, StrictStr

from contract.structure_base import StructureModel
from contract.structure_common import StructureStatus


class Rack(StructureModel):
    """Rack response."""

    id: StrictStr
    aisle_id: StrictStr = Field(alias="aisleId")
    label: StrictStr
    max_height: StrictInt = Field(alias="maxHeight")
    height_unit: StrictStr = Field(alias="heightUnit")
    status: StructureStatus = StructureStatus.ACTIVE
    shelf_count: Optional[int] = Field(default=None, alias="shelfCount")


class RackCreate(StructureModel):
    """POST /aisles/{aisleId}/racks body."""

    label: StrictStr
    max_height: StrictInt = Field(alias="maxHeight", gt=0)
    height_unit: StrictStr = Field(alias="heightUnit")


class RackUpdate(StructureModel):
    """PATCH /racks/{id} body."""

    label: Optional[StrictStr] = None
    max_height: Optional[StrictInt] = Field(default=None, alias="maxHeight", gt=0)
    height_unit: Optional[StrictStr] = Field(default=None, alias="heightUnit")
    status: Optional[StructureStatus] = None
