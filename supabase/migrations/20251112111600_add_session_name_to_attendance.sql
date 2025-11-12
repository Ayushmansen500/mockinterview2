/*
  # Add Session Name to Attendance Sessions

  1. Changes
    - Add `session_name` column to `attendance_sessions` table
      - Default format: "Attendance - [Date]"
      - Allows admin to customize session names
    
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Updates existing rows with default naming convention
*/

-- Add session_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_sessions' AND column_name = 'session_name'
  ) THEN
    ALTER TABLE attendance_sessions ADD COLUMN session_name text DEFAULT '';
    
    -- Update existing records with default name based on date
    UPDATE attendance_sessions
    SET session_name = 'Attendance - ' || TO_CHAR(session_date, 'Mon DD, YYYY')
    WHERE session_name = '' OR session_name IS NULL;
    
    -- Make it NOT NULL after setting defaults
    ALTER TABLE attendance_sessions ALTER COLUMN session_name SET NOT NULL;
  END IF;
END $$;
