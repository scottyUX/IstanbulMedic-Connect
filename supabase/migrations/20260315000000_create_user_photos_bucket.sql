-- Create Supabase Storage bucket for user hair photos
-- Migration: 20260315000000_create_user_photos_bucket.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-photos',
  'user-photos',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload their own photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update/replace their own photos
create policy "Users can update their own photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own photos
create policy "Users can delete their own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'user-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read (bucket is public, but explicit policy for clarity)
create policy "Anyone can view user photos"
  on storage.objects for select
  to public
  using (bucket_id = 'user-photos');
