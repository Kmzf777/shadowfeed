-- Storage extension is pre-installed in Supabase, skipping create extension check


-- Create the avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies to avoid conflicts/duplication
drop policy if exists "Avatars are publicly viewable" on storage.objects;
drop policy if exists "Users can upload to their own avatar folder" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12a_0" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12a_1" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12a_2" on storage.objects;
drop policy if exists "Give users access to own folder 1ok12a_3" on storage.objects;

-- Create comprehensive policies for the avatars bucket

-- 1. Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Authenticated Upload (Insert)
-- Allow users to upload files to a folder named after their user ID
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Authenticated Update
-- Allow users to update their own files
create policy "Authenticated Update"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Authenticated Delete
-- Allow users to delete their own files
create policy "Authenticated Delete"
on storage.objects for delete
using (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);
