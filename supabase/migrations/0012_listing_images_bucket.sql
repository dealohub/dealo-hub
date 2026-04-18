-- ============================================================================
-- 0012_listing_images_bucket.sql — Storage: listing photos
-- ============================================================================
-- Path convention:
--   {user_uuid}/drafts/{draft_id}/image-{position}-{timestamp}.webp
-- On publish the client rewrites the prefix to:
--   {user_uuid}/listings/{listing_id}/...
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,  -- 5 MB per file (client resizes to 1920px @ WebP 0.85 before upload)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "listing_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "listing_images_user_upload"   ON storage.objects;
DROP POLICY IF EXISTS "listing_images_user_update"   ON storage.objects;
DROP POLICY IF EXISTS "listing_images_user_delete"   ON storage.objects;

CREATE POLICY "listing_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_user_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listing_images_user_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listing_images_user_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
