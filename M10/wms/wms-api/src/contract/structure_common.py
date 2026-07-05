# coding: utf-8

"""Shared enums for warehouse-structure contracts."""

from __future__ import annotations

from enum import Enum


class StructureStatus(str, Enum):
    """Lifecycle status shared by every structure entity.

    - ACTIVE: in service, available for allocation.
    - BLOCKED: temporarily unavailable (e.g. damaged, audit hold).
    - MAINTENANCE: out for repair/cleaning.
    - INACTIVE: soft-deleted / decommissioned (set by DELETE).
    """

    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"
    MAINTENANCE = "MAINTENANCE"
    INACTIVE = "INACTIVE"

    # Statuses a client may set via create/update. INACTIVE is reserved for DELETE.
    @classmethod
    def assignable(cls) -> set["StructureStatus"]:
        return {cls.ACTIVE, cls.BLOCKED, cls.MAINTENANCE}
