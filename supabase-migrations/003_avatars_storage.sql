-- Create storage bucket for avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

-- RLS policies for avatars bucket
-- Allow public read access (for viewing avatars)
create policy "Avatars are publicly viewable"
on storage.objects for select
using (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
create policy "Users can upload to their own avatar folder"
on storage.objects for insert
with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
create policy "Users can update their own avatars"
on storage.objects for update
with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
create policy "Users can delete their own avatars"
on storage.objects for delete
using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
);
