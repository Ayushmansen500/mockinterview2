/*
  # Zoom Attendance Tracking System

  1. New Tables
    - `attendance_sessions`
      - `id` (uuid, primary key)
      - `session_date` (date, unique) - The date for this attendance session
      - `session_code` (text, unique) - Unique code for the public URL (e.g., "attend-2025-11-12")
      - `is_active` (boolean) - Whether this session is currently active
      - `expires_at` (timestamptz) - When this session expires (24 hours)
      - `created_by` (uuid) - Admin who created the session
      - `created_at` (timestamptz)
      
    - `attendance_records`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to attendance_sessions)
      - `student_name` (text) - Name of the student
      - `student_email` (text, nullable) - Optional email for verification
      - `marked_at` (timestamptz) - When attendance was marked
      - `status` (text) - "present" or "absent"
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on both tables
    - Admin can create sessions and view all attendance
    - Public can mark attendance via active session code
    - Prevent duplicate attendance for same student on same session
    
  3. Indexes
    - Index on session_date for fast daily lookups
    - Index on session_code for public URL access
    - Composite index on (session_id, student_name) for duplicate prevention
*/

-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date date NOT NULL UNIQUE,
  session_code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES admins(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_email text,
  marked_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_code ON attendance_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_name ON attendance_records(student_name);

-- Enable RLS
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for attendance_sessions

-- Admin can view all sessions
CREATE POLICY "Admins can view all attendance sessions"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Admin can create sessions
CREATE POLICY "Admins can create attendance sessions"
  ON attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Admin can update sessions
CREATE POLICY "Admins can update attendance sessions"
  ON attendance_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Public can view active sessions by code (for attendance marking)
CREATE POLICY "Anyone can view active sessions by code"
  ON attendance_sessions FOR SELECT
  TO anon
  USING (is_active = true AND expires_at > now());

-- Policies for attendance_records

-- Admin can view all attendance records
CREATE POLICY "Admins can view all attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Public can insert attendance records (mark attendance)
CREATE POLICY "Anyone can mark attendance for active sessions"
  ON attendance_records FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE attendance_sessions.id = session_id
      AND attendance_sessions.is_active = true
      AND attendance_sessions.expires_at > now()
    )
  );

-- Admin can update attendance records
CREATE POLICY "Admins can update attendance records"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Admin can delete attendance records
CREATE POLICY "Admins can delete attendance records"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Function to auto-expire old sessions
CREATE OR REPLACE FUNCTION expire_old_attendance_sessions()
RETURNS void AS $$
BEGIN
  UPDATE attendance_sessions
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
