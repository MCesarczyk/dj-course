# coding: utf-8

"""Warehouse (Magazyn) contracts — top of the storage hierarchy.

Replaces the original generated stub (id+name only), which was unused.
"""

from __future__ import annotations

from typing import Optional

from pydantic import Field, StrictStr

from contract.structure_base import StructureModel
from contract.structure_common import StructureStatus


class LocationInfo(StructureModel):
    """Physical address of a warehouse (`location` table)."""

    address: StrictStr
    city: StrictStr
    postal_code: StrictStr = Field(alias="postalCode")
    country: StrictStr


class Warehouse(StructureModel):
    """Warehouse response (list item and details)."""

    id: StrictStr
    name: StrictStr
    description: Optional[StrictStr] = None
    status: StructureStatus = StructureStatus.ACTIVE
    location: Optional[LocationInfo] = None
    zone_count: Optional[int] = Field(default=None, alias="zoneCount")


class WarehouseCreate(StructureModel):
    """POST /warehouses body. Creates the warehouse together with its location."""

    name: StrictStr
    description: StrictStr
    location: LocationInfo


class WarehouseUpdate(StructureModel):
    """PATCH /warehouses/{id} body. All fields optional; only provided keys change."""

    name: Optional[StrictStr] = None
    description: Optional[StrictStr] = None
    status: Optional[StructureStatus] = None
