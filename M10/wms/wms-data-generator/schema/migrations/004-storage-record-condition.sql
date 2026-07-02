-- Migration 004: add a physical condition to storage records.
--
-- Lets goods be flagged without leaving stock (DAMAGED) or written off
-- (LOST) distinctly from a normal dispatch:
--   GOOD    - default, on stock
--   DAMAGED - still physically on the shelf (counts as occupied), flagged
--   LOST    - written off; the operation also sets actual_exit_date so it
--             stops counting as occupied, but LOST stays distinguishable
--             from DISPATCHED via this column.
--
-- Idempotent.

ALTER TABLE storage_record ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'GOOD';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'storage_record_condition_check') THEN
        ALTER TABLE storage_record
            ADD CONSTRAINT storage_record_condition_check
            CHECK (condition IN ('GOOD','DAMAGED','LOST'));
    END IF;
END $$;
