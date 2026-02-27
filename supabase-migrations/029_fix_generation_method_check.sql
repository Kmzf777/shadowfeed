-- Migration: 029_fix_generation_method_check
-- Safely add 'shadowfeed' to the allowed generation_method values for sf_posts

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sf_posts_generation_method_check'
  ) THEN
    ALTER TABLE sf_posts DROP CONSTRAINT sf_posts_generation_method_check;
  END IF;
  
  ALTER TABLE sf_posts ADD CONSTRAINT sf_posts_generation_method_check 
    CHECK (generation_method IN ('manual', 'smart', 'shadowfeed'));
END $$;
