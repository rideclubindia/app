-- Fix RLS policy for error_logs table
-- Allow anyone to insert into error_logs from the frontend

CREATE POLICY "Allow anyone to insert error logs" 
  ON public.error_logs
  FOR INSERT 
  WITH CHECK (true);
