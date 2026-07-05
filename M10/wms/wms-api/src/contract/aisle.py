# coding: utf-8

"""Aisle (Rząd) contracts — child of zone."""

from __future__ import annotations

from typing import Optional

from pydantic import Field, StrictInt, StrictStr

from contract.structure_base import StructureModel
from contract.structure_common import StructureStatus


class Aisle(StructureModel):
    """Aisle response."""

    id: StrictStr
    zone_id: StrictStr = Field(alias="zoneId")
    label: StrictStr
    width: StrictInt
    width_unit: StrictStr = Field(alias="widthUnit")
    status: StructureStatus = StructureStatus.ACTIVE
    rack_count: Optional[int] = Field(default=None, alias="rackCount")


class AisleCreate(StructureModel):
    """POST /zones/{zoneId}/aisles body."""

    label: StrictStr
    width: StrictInt = Field(gt=0)
    width_unit: StrictStr = Field(alias="widthUnit")


class AisleUpdate(StructureModel):
    """PATCH /aisles/{id} body."""

    label: Optional[StrictStr] = None
    width: Optional[StrictInt] = Field(default=None, gt=0)
    width_unit: Optional[StrictStr] = Field(default=None, alias="widthUnit")
    status: Optional[StructureStatus] = None
