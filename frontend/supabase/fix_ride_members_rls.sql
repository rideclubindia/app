-- Fix for "new row violates row level security policy for ride_members"
-- Run this in your Supabase SQL Editor to allow users to join private rides

-- Drop existing INSERT policy if it exists (change the name if it's different in your dashboard)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.ride_members;
DROP POLICY IF EXISTS "Users can join public rides" ON public.ride_members;

-- Create a new policy that allows a user to insert their own membership record.
-- Since the user must successfully query the `rides` table using the 6-character ride_code 
-- to get the `ride_id` UUID in the first place, we can safely allow the insertion here.
CREATE POLICY "Users can join rides" 
ON public.ride_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
