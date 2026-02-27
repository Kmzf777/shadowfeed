-- Migration 033: Drop the style check constraint on sf_posts
-- The constraint is too restrictive and doesn't include 'crt-terminal' style
-- used by the shadowfeed-brand theme. Style values are controlled by application code.

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
            AND con.conrelid = 'public.sf_posts'::regclass
            AND att.attname = 'style'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.table_name, r.conname);
        RAISE NOTICE 'Dropped constraint % on %', r.conname, r.table_name;
    END LOOP;
END $$;
