/*
  # Fix Attendance Session Constraints and Policies

  1. Changes
    - Drop the UNIQUE constraint on session_date to allow multiple batches per day
    - Update RLS policy for anonymous users to only check is_active
    - Add composite unique constraint on (batch_id, session_date) instead
  
  2. Security
    - Anonymous users can view and mark attendance for active sessions
    - No expiration check needed since sessions are manually controlled via is_active
*/

-- Drop the old unique constraint on session_date
ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_session_date_key;

-- Add composite unique constraint to allow one session per batch per day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'attendance_sessions_batch_date_unique'
  ) THEN
    ALTER TABLE attendance_sessions 
    ADD CONSTRAINT attendance_sessions_batch_date_unique 
    UNIQUE (batch_id, session_date);
  END IF;
END $$;

-- Drop old policy for anonymous users
DROP POLICY IF EXISTS "Anyone can view active sessions by code" ON attendance_sessions;

-- Create new policy without expiration check
CREATE POLICY "Anyone can view active sessions by code"
  ON attendance_sessions FOR SELECT
  TO anon
  USING (is_active = true);

-- Update the policy for marking attendance (no expiration check)
DROP POLICY IF EXISTS "Anyone can mark attendance for active sessions" ON attendance_records;

CREATE POLICY "Anyone can mark attendance for active sessions"
  ON attendance_records FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE attendance_sessions.id = session_id
      AND attendance_sessions.is_active = true
    )
  );
