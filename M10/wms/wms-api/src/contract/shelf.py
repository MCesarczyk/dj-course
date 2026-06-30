# coding: utf-8

"""Shelf (Półka) contracts — leaf of the hierarchy, the actual storage location.

The response carries capacity AND live occupancy (reserved vs. available), plus a
human-readable `locationCode` (zone-aisle-rack-level) — the address operators
scan on the floor. This is the value-add over a plain CRUD row.
"""

from __future__ import annotations

from typing import Optional

from pydantic import Field, StrictInt, StrictStr

from contract.structure_base import StructureModel
from contract.structure_common import StructureStatus


class Shelf(StructureModel):
    """Shelf response, including capacity and current occupancy."""

    id: StrictStr
    rack_id: StrictStr = Field(alias="rackId")
    level: StrictStr
    location_code: Optional[StrictStr] = Field(default=None, alias="locationCode")
    status: StructureStatus = StructureStatus.ACTIVE
    # Nominal capacity
    max_weight: float = Field(alias="maxWeight")
    max_volume: float = Field(alias="maxVolume")
    # Live occupancy (sum of ACTIVE reservations)
    reserved_weight: float = Field(default=0, alias="reservedWeight")
    reserved_volume: float = Field(default=0, alias="reservedVolume")
    available_weight: float = Field(default=0, alias="availableWeight")
    available_volume: float = Field(default=0, alias="availableVolume")


class ShelfCreate(StructureModel):
    """POST /racks/{rackId}/shelves body."""

    level: StrictStr
    max_weight: float = Field(alias="maxWeight", gt=0)
    max_volume: float = Field(alias="maxVolume", gt=0)


class ShelfBulkCreate(StructureModel):
    """POST /racks/{rackId}/shelves:bulk body — provision N identical shelves at once.

    Levels are generated as `{levelPrefix}{1..count}` (default prefix "L").
    """

    count: StrictInt = Field(gt=0, le=100)
    max_weight: float = Field(alias="maxWeight", gt=0)
    max_volume: float = Field(alias="maxVolume", gt=0)
    level_prefix: StrictStr = Field(default="L", alias="levelPrefix")


class ShelfUpdate(StructureModel):
    """PATCH /shelves/{id} body."""

    level: Optional[StrictStr] = None
    max_weight: Optional[float] = Field(default=None, alias="maxWeight", gt=0)
    max_volume: Optional[float] = Field(default=None, alias="maxVolume", gt=0)
    status: Optional[StructureStatus] = None
