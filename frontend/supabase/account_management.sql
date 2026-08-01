-- Account Management RPC Functions
-- Run this in your Supabase SQL Editor

-- Function to safely delete a user account from the client
-- This requires SECURITY DEFINER so it runs with postgres privileges to delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users
  -- Because auth.users is linked to public.profiles via ON DELETE CASCADE (in a standard setup),
  -- this will automatically delete their profile, pins, ride_members, etc.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
