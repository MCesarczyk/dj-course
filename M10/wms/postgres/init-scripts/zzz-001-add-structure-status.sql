-- Migration 001: add lifecycle status to the warehouse-structure tables.
--
-- WMS structure entities (warehouse/zone/aisle/rack/shelf) are physical objects:
-- they are never hard-deleted, only decommissioned. The API uses this column for
-- soft-delete (DELETE -> status = 'INACTIVE') and for operational states
-- (BLOCKED / MAINTENANCE) that take a location out of allocation without losing history.
--
-- Idempotent: safe to run against an already-seeded database.

ALTER TABLE warehouse ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE zone      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE aisle     ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE rack      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE shelf     ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
    -- CHECK constraints (ADD COLUMN IF NOT EXISTS cannot carry one conditionally)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'warehouse_status_check') THEN
        ALTER TABLE warehouse ADD CONSTRAINT warehouse_status_check CHECK (status IN ('ACTIVE','BLOCKED','MAINTENANCE','INACTIVE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zone_status_check') THEN
        ALTER TABLE zone ADD CONSTRAINT zone_status_check CHECK (status IN ('ACTIVE','BLOCKED','MAINTENANCE','INACTIVE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aisle_status_check') THEN
        ALTER TABLE aisle ADD CONSTRAINT aisle_status_check CHECK (status IN ('ACTIVE','BLOCKED','MAINTENANCE','INACTIVE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rack_status_check') THEN
        ALTER TABLE rack ADD CONSTRAINT rack_status_check CHECK (status IN ('ACTIVE','BLOCKED','MAINTENANCE','INACTIVE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shelf_status_check') THEN
        ALTER TABLE shelf ADD CONSTRAINT shelf_status_check CHECK (status IN ('ACTIVE','BLOCKED','MAINTENANCE','INACTIVE'));
    END IF;
END $$;

-- Partial indexes: the common query is "active locations only".
CREATE INDEX IF NOT EXISTS idx_zone_warehouse_active ON zone(warehouse_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_aisle_zone_active ON aisle(zone_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_rack_aisle_active ON rack(aisle_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_shelf_rack_active ON shelf(rack_id) WHERE status = 'ACTIVE';
