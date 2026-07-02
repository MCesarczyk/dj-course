-- Migration 003: add 'FULFILLED' to the storage_reservation status enum.
--
-- A reservation is realized when goods are actually received against it
-- (POST /storage/reservations/{id}/fulfill). It then stops counting as booked
-- capacity and the goods count as physically occupied instead. 'FULFILLED' is
-- the terminal state for that transition.
--
-- Idempotent: drops and recreates the CHECK constraint with the extended set.

ALTER TABLE storage_reservation DROP CONSTRAINT IF EXISTS storage_reservation_status_check;
ALTER TABLE storage_reservation
    ADD CONSTRAINT storage_reservation_status_check
    CHECK (status IN ('PENDING','ACTIVE','EXPIRED','CANCELLED','FULFILLED'));
