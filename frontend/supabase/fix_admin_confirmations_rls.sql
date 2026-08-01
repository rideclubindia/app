-- Add Admin RLS Policies for Confirmations
-- Run this in your Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE public.confirmations ENABLE ROW LEVEL SECURITY;

-- 1. Allow admins to view all confirmations
DROP POLICY IF EXISTS "Admins can view all confirmations" ON public.confirmations;
CREATE POLICY "Admins can view all confirmations"
  ON public.confirmations
  FOR SELECT
  USING (public.is_admin());

-- 2. Allow admins to update all confirmations
DROP POLICY IF EXISTS "Admins can update all confirmations" ON public.confirmations;
CREATE POLICY "Admins can update all confirmations"
  ON public.confirmations
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Allow admins to delete confirmations
DROP POLICY IF EXISTS "Admins can delete all confirmations" ON public.confirmations;
CREATE POLICY "Admins can delete all confirmations"
  ON public.confirmations
  FOR DELETE
  USING (public.is_admin());
