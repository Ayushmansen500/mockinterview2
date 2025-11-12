/*
  # Add Batch Name to Attendance Sessions

  1. Changes
    - Add `batch_name` column to `attendance_sessions` table
    - Set default batch name for existing sessions
  
  2. Notes
    - Allows organizing attendance by batch/class
    - Helpful for tracking multiple batches
*/

-- Add batch_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_sessions' AND column_name = 'batch_name'
  ) THEN
    -- Add the column
    ALTER TABLE attendance_sessions ADD COLUMN batch_name text DEFAULT 'Default Batch';
    
    -- Make it NOT NULL
    ALTER TABLE attendance_sessions ALTER COLUMN batch_name SET NOT NULL;
  END IF;
END $$;
