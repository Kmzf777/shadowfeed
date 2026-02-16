-- Migration 014: Drop any remaining CHECK constraints on text fields
-- Follows up on 012_drop_user_prompt_check.sql which only handled user_prompt.
-- These CHECK constraints can cause PostgREST to hang when text is near the limit.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname, con.conrelid::regclass AS table_name
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid
            AND att.attnum = ANY(con.conkey)
        WHERE con.contype = 'c'
            AND con.conrelid = 'public.users'::regclass
            AND att.attname IN ('target_audience', 'main_pain_point', 'user_prompt')
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.table_name, r.conname);
        RAISE NOTICE 'Dropped constraint % on %', r.conname, r.table_name;
    END LOOP;
END $$;
