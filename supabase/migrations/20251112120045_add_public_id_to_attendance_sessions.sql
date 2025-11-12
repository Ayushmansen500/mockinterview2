/*
  # Add Public ID to Attendance Sessions

  1. Changes
    - Add `public_id` column to `attendance_sessions` table
    - Generate unique public IDs for existing sessions
    - Add index for better performance
  
  2. Security
    - Update RLS policies to allow public read access via public_id
*/

-- Add public_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_sessions' AND column_name = 'public_id'
  ) THEN
    -- Add the column
    ALTER TABLE attendance_sessions ADD COLUMN public_id text UNIQUE;
    
    -- Generate unique public IDs for existing records
    UPDATE attendance_sessions
    SET public_id = 'attend-' || encode(gen_random_bytes(8), 'hex')
    WHERE public_id IS NULL;
    
    -- Make it NOT NULL after populating
    ALTER TABLE attendance_sessions ALTER COLUMN public_id SET NOT NULL;
    
    -- Add default for new records
    ALTER TABLE attendance_sessions ALTER COLUMN public_id SET DEFAULT 'attend-' || encode(gen_random_bytes(8), 'hex');
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_public_id ON attendance_sessions(public_id);

-- Update RLS policies to allow public read access
DROP POLICY IF EXISTS "Public can view active attendance sessions" ON attendance_sessions;
CREATE POLICY "Public can view active attendance sessions"
  ON attendance_sessions FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view records from active sessions" ON attendance_records;
CREATE POLICY "Public can view records from active sessions"
  ON attendance_records FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE attendance_sessions.id = session_id
      AND attendance_sessions.is_active = true
    )
  );
