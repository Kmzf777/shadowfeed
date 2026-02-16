-- ============================================
-- Fix: Reset RLS policies on public.users
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop ALL existing policies on users table
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies where tablename = 'users' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
  end loop;
end;
$$;

-- 2. Ensure RLS is enabled
alter table public.users enable row level security;

-- 3. SELECT: anyone can view profiles
create policy "users_select_public"
  on public.users for select
  using (true);

-- 4. INSERT: authenticated users can create their own row
create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

-- 5. UPDATE: authenticated users can update their own row
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 6. Service role bypasses RLS (for backend/triggers)
create policy "users_service_role_all"
  on public.users
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
