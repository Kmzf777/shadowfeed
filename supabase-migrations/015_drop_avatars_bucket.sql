-- Drop all policies on storage.objects for the avatars bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Delete all objects in the avatars bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Delete the bucket
DELETE FROM storage.buckets WHERE id = 'avatars';
