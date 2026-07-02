# coding: utf-8

"""Inventory-state contracts — the read layer over `storage_record`.

"Inventory" here is cargo lots (storage_record) physically stored on shelves
(actual_exit_date IS NULL), described by free text + weight/volume and owned by
a party. There is no product/SKU entity in this 3PL model.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import Field, StrictInt, StrictStr

from contract.structure_base import StructureModel


class StorageRecordItem(StructureModel):
    """A single cargo lot currently stored on a shelf."""

    record_id: StrictStr = Field(alias="recordId")
    party_id: StrictStr = Field(alias="partyId")
    party_name: Optional[StrictStr] = Field(default=None, alias="partyName")
    warehouse_id: Optional[StrictStr] = Field(default=None, alias="warehouseId")
    shelf_id: Optional[StrictStr] = Field(default=None, alias="shelfId")
    location_code: Optional[StrictStr] = Field(default=None, alias="locationCode")
    cargo_description: Optional[StrictStr] = Field(default=None, alias="cargoDescription")
    cargo_weight: float = Field(alias="cargoWeight")
    cargo_volume: float = Field(alias="cargoVolume")
    entry_date: Optional[StrictStr] = Field(default=None, alias="entryDate")


class ShelfContents(StructureModel):
    """What is physically stored on one shelf, with a summary."""

    shelf_id: StrictStr = Field(alias="shelfId")
    location_code: Optional[StrictStr] = Field(default=None, alias="locationCode")
    record_count: StrictInt = Field(alias="recordCount")
    occupied_weight: float = Field(alias="occupiedWeight")
    occupied_volume: float = Field(alias="occupiedVolume")
    items: List[StorageRecordItem] = Field(default_factory=list)


class ZoneInventory(StructureModel):
    """Aggregated stored goods for a single zone."""

    zone_id: StrictStr = Field(alias="zoneId")
    zone_name: StrictStr = Field(alias="zoneName")
    record_count: StrictInt = Field(alias="recordCount")
    total_weight: float = Field(alias="totalWeight")
    total_volume: float = Field(alias="totalVolume")


class WarehouseInventory(StructureModel):
    """Warehouse-level inventory rollup, broken down by zone."""

    warehouse_id: StrictStr = Field(alias="warehouseId")
    record_count: StrictInt = Field(alias="recordCount")
    total_weight: float = Field(alias="totalWeight")
    total_volume: float = Field(alias="totalVolume")
    zones: List[ZoneInventory] = Field(default_factory=list)
