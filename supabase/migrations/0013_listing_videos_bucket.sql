-- ============================================================================
-- 0013_listing_videos_bucket.sql — Storage: luxury inspection videos
-- ============================================================================
-- Luxury category only. 30–60s videos, max 50 MB.
-- Same user-scoped path convention as listing-images.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-videos',
  'listing-videos',
  true,
  52428800,  -- 50 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "listing_videos_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "listing_videos_user_upload"   ON storage.objects;
DROP POLICY IF EXISTS "listing_videos_user_update"   ON storage.objects;
DROP POLICY IF EXISTS "listing_videos_user_delete"   ON storage.objects;

CREATE POLICY "listing_videos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-videos');

CREATE POLICY "listing_videos_user_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listing_videos_user_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'listing-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "listing_videos_user_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
