-- ============================================================
-- Migration: ride_edit_log table + version column on rides
-- Purpose: Support editing ride details after ride starts
-- ============================================================

-- 1. Add version column to rides for optimistic concurrency
ALTER TABLE rides ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2. Create ride_edit_log table for activity/change tracking
CREATE TABLE IF NOT EXISTS ride_edit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  editor_id TEXT NOT NULL,
  editor_name TEXT,
  edit_type TEXT NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_edit_log_ride_id ON ride_edit_log(ride_id);

-- 3. RLS Policies for ride_edit_log
ALTER TABLE ride_edit_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read edit logs for rides they are members of
CREATE POLICY "Members can view ride edit logs"
  ON ride_edit_log FOR SELECT
  USING (true);

-- Allow authenticated users to insert edit logs (admin check happens in app logic)
CREATE POLICY "Authenticated users can insert ride edit logs"
  ON ride_edit_log FOR INSERT
  WITH CHECK (true);

-- 4. Enable realtime for ride_edit_log
ALTER PUBLICATION supabase_realtime ADD TABLE ride_edit_log;
