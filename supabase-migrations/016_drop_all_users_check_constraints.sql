-- Migration 016: Drop ALL CHECK constraints on public.users
-- Previous migrations (012, 014) attempted to drop specific constraints
-- but may not have run on the live DB. This nuclear approach drops them all.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'users'
          AND nsp.nspname = 'public'
          AND con.contype = 'c'  -- 'c' = CHECK constraint
    LOOP
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', r.conname);
        RAISE NOTICE 'Dropped CHECK constraint: %', r.conname;
    END LOOP;
END $$;
