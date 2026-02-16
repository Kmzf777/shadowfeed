-- 012: Drop the CHECK constraint on user_prompt that limits it to 500 chars.
-- The frontend already enforces the 500-char limit via maxLength + .slice(0, 500).
-- The DB constraint causes silent PostgREST errors when text reaches 500 chars.

DO $$
DECLARE
    _constraint_name text;
BEGIN
    -- Find and drop any CHECK constraint on the user_prompt column
    FOR _constraint_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
            AND att.attrelid = con.conrelid
        WHERE con.conrelid = 'public.users'::regclass
            AND att.attname = 'user_prompt'
            AND con.contype = 'c'
    LOOP
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', _constraint_name);
        RAISE NOTICE 'Dropped constraint: %', _constraint_name;
    END LOOP;
END $$;
