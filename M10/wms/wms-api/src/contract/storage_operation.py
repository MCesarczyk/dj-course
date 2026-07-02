# coding: utf-8

"""Storage-operation contracts — writes over `storage_record` + `cargo_event_history`.

Three operations move goods through their lifecycle:
  - receipt  (przyjęcie)   : goods arrive -> new storage_record + RECEIVED event
  - move     (przesunięcie): change shelf -> MOVED event
  - dispatch (wydanie)     : goods leave  -> set actual_exit_date + DISPATCHED event
"""

from __future__ import annotations

from typing import Optional

from pydantic import Field, StrictStr

from contract.structure_base import StructureModel


class ReceiptCreate(StructureModel):
    """POST /storage/receipts — put goods away on a shelf against a storage request.

    The owning party is derived from the request; only the physical facts are
    supplied here.
    """

    request_id: StrictStr = Field(alias="requestId")
    shelf_id: StrictStr = Field(alias="shelfId")
    cargo_description: StrictStr = Field(alias="cargoDescription")
    cargo_weight: float = Field(alias="cargoWeight", gt=0)
    cargo_volume: float = Field(alias="cargoVolume", gt=0)
    entry_date: Optional[StrictStr] = Field(default=None, alias="entryDate")


class ReservationFulfill(StructureModel):
    """POST /storage/reservations/{id}/fulfill — receive goods against a reservation.

    Shelf, request and owner come from the reservation. Cargo weight/volume are
    optional and default to the reserved amounts; if given they must not exceed
    what was booked.
    """

    cargo_description: Optional[StrictStr] = Field(default=None, alias="cargoDescription")
    cargo_weight: Optional[float] = Field(default=None, alias="cargoWeight", gt=0)
    cargo_volume: Optional[float] = Field(default=None, alias="cargoVolume", gt=0)
    entry_date: Optional[StrictStr] = Field(default=None, alias="entryDate")


class MoveRequest(StructureModel):
    """POST /storage/{id}/move — relocate a stored lot to another shelf."""

    target_shelf_id: StrictStr = Field(alias="targetShelfId")
    note: Optional[StrictStr] = None


class DispatchRequest(StructureModel):
    """POST /storage/{id}/dispatch — release goods from the warehouse."""

    exit_date: Optional[StrictStr] = Field(default=None, alias="exitDate")
    note: Optional[StrictStr] = None


class StorageRecord(StructureModel):
    """Full storage-record response (open or closed)."""

    record_id: StrictStr = Field(alias="recordId")
    request_id: StrictStr = Field(alias="requestId")
    party_id: StrictStr = Field(alias="partyId")
    party_name: Optional[StrictStr] = Field(default=None, alias="partyName")
    shelf_id: StrictStr = Field(alias="shelfId")
    location_code: Optional[StrictStr] = Field(default=None, alias="locationCode")
    cargo_description: Optional[StrictStr] = Field(default=None, alias="cargoDescription")
    cargo_weight: float = Field(alias="cargoWeight")
    cargo_volume: float = Field(alias="cargoVolume")
    entry_date: Optional[StrictStr] = Field(default=None, alias="entryDate")
    exit_date: Optional[StrictStr] = Field(default=None, alias="exitDate")
    status: StrictStr  # STORED | DISPATCHED
