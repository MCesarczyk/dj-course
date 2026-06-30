-- Migration 002: resynchronize SERIAL sequences with existing data.
--
-- The seed dump inserts rows with explicit primary-key values but does not
-- advance the owning sequences, so the next INSERT via the API collides
-- (duplicate key on *_pkey). This realigns every sequence to MAX(column),
-- making the seeded database writable. Idempotent and safe to re-run.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT s.relname AS seq_name,
               t.relname AS table_name,
               a.attname AS column_name
        FROM pg_class s
        JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
        JOIN pg_class t ON t.oid = d.refobjid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
        WHERE s.relkind = 'S'
    LOOP
        EXECUTE format(
            'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1))',
            r.seq_name, r.column_name, r.table_name
        );
    END LOOP;
END $$;
