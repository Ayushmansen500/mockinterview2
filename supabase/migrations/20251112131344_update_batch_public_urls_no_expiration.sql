/*
  # Update Batch Public URLs - Remove Expiration

  1. Changes
    - Make expires_at nullable to support permanent URLs
    - Update RLS policies to support non-expiring URLs
    - Update functions to handle null expiration dates
  
  2. Security
    - URLs remain secure through public_id uniqueness
    - Admin can still deactivate URLs via is_active flag
    - Public access controlled through is_active status only
*/

-- Make expires_at nullable for permanent URLs
ALTER TABLE batch_public_urls ALTER COLUMN expires_at DROP NOT NULL;

-- Drop old policies that check expiration
DROP POLICY IF EXISTS "Admins can view all batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Admins can create batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Admins can update batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Admins can delete batch public URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Public can view active batch URLs" ON batch_public_urls;
DROP POLICY IF EXISTS "Public can view batches via valid public URL" ON batches;
DROP POLICY IF EXISTS "Public can view batch students via valid public URL" ON batch_students;
DROP POLICY IF EXISTS "Public can view attendance sessions via batch public URL" ON attendance_sessions;
DROP POLICY IF EXISTS "Public can view attendance records via batch public URL" ON attendance_records;

-- Recreate policies without expiration checks
CREATE POLICY "Admins can view all batch public URLs"
  ON batch_public_urls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create batch public URLs"
  ON batch_public_urls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update batch public URLs"
  ON batch_public_urls FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete batch public URLs"
  ON batch_public_urls FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM batches
      WHERE batches.id = batch_id
      AND batches.created_by = auth.uid()
    )
  );

-- Public can view active URLs (no expiration check)
CREATE POLICY "Public can view active batch URLs"
  ON batch_public_urls FOR SELECT
  TO anon
  USING (is_active = true);

-- Public can view batch data via active public URL
CREATE POLICY "Public can view batches via valid public URL"
  ON batches FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = batches.id
      AND batch_public_urls.is_active = true
    )
  );

CREATE POLICY "Public can view batch students via valid public URL"
  ON batch_students FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = batch_students.batch_id
      AND batch_public_urls.is_active = true
    )
  );

CREATE POLICY "Public can view attendance sessions via batch public URL"
  ON attendance_sessions FOR SELECT
  TO anon
  USING (
    batch_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM batch_public_urls
      WHERE batch_public_urls.batch_id = attendance_sessions.batch_id
      AND batch_public_urls.is_active = true
    )
  );

CREATE POLICY "Public can view attendance records via batch public URL"
  ON attendance_records FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions ats
      INNER JOIN batch_public_urls bpu ON bpu.batch_id = ats.batch_id
      WHERE ats.id = attendance_records.session_id
      AND bpu.is_active = true
    )
  );

-- Update the auto-expire function to be a no-op (kept for compatibility)
CREATE OR REPLACE FUNCTION expire_old_batch_public_urls()
RETURNS void AS $$
BEGIN
  -- No longer auto-expires URLs
  -- URLs are permanent unless manually deactivated via is_active flag
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the change
COMMENT ON COLUMN batch_public_urls.expires_at IS 'Deprecated: URLs no longer expire automatically. Use is_active to control access.';
