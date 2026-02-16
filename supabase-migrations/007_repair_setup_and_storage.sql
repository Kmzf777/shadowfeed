-- ==========================================
-- REPAIR SCRIPT: Fix Setup & Storage Issues
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Ensure Storage Bucket Exists & is Public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 
  'avatars', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Ensure Users Table Columns Exist
alter table public.users 
add column if not exists setup_completed boolean default false,
add column if not exists avatar_path text,
add column if not exists highlight_color text default '#8a00c4',
add column if not exists instagram_handle text,
add column if not exists instagram_username text,
add column if not exists target_audience text,
add column if not exists main_pain_point text,
add column if not exists voice_tone text default 'professional',
add column if not exists user_prompt text;

-- 3. Reset RLS Policies for Users Table
-- First, drop existing policies to start fresh
drop policy if exists "Public profiles are viewable by everyone." on public.users;
drop policy if exists "Users can insert their own profile." on public.users;
drop policy if exists "Users can update own profile." on public.users;
drop policy if exists "users_select_public" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_service_role_all" on public.users;

-- Re-enable RLS
alter table public.users enable row level security;

-- Create simple, robust policies
create policy "users_read_all"
  on public.users for select
  using (true);

create policy "users_insert_self"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_self"
  on public.users for update
  using (auth.uid() = id);

-- 4. Reset Storage Policies for Avatars
-- Drop existing policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Update" on storage.objects;
drop policy if exists "Authenticated Delete" on storage.objects;

-- Re-create policies
create policy "avatars_read_all"
on storage.objects for select
using ( bucket_id = 'avatars' );

create policy "avatars_insert_self"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_update_self"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_delete_self"
on storage.objects for delete
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);
