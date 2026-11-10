ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can read their own avatar objects"
  ON storage.objects;
CREATE POLICY "Users can read their own avatar objects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
    AND array_length(storage.foldername(name), 1) = 1
  );

DROP POLICY IF EXISTS "Users can upload their own avatar objects"
  ON storage.objects;
CREATE POLICY "Users can upload their own avatar objects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
    AND array_length(storage.foldername(name), 1) = 1
  );

DROP POLICY IF EXISTS "Users can update their own avatar objects"
  ON storage.objects;
CREATE POLICY "Users can update their own avatar objects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
    AND array_length(storage.foldername(name), 1) = 1
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
    AND array_length(storage.foldername(name), 1) = 1
  );

DROP POLICY IF EXISTS "Users can delete their own avatar objects"
  ON storage.objects;
CREATE POLICY "Users can delete their own avatar objects"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
    AND array_length(storage.foldername(name), 1) = 1
  );
