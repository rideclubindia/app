-- SUPABASE MIGRATION: 20260615_admin_rls_policies.sql
-- DESCRIPTION: Enforce Admin Role checking on sensitive tables natively in the database.

-- 1. Create the cms_policies table
CREATE TABLE IF NOT EXISTS public.cms_policies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    content text NOT NULL,
    version int NOT NULL,
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Example: Admin Policies for cms_policies table
ALTER TABLE public.cms_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to cms_policies" 
ON public.cms_policies 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admins to modify cms_policies" 
ON public.cms_policies 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'iharsharoyal@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'iharsharoyal@gmail.com');

-- 2. Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    target_id text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Example: Admin Policies for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'iharsharoyal@gmail.com');

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Example: Allow admins to modify profiles (e.g. banning users)
CREATE POLICY "Allow admins full access to profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'iharsharoyal@gmail.com');

-- INSTRUCTIONS:
-- Run these statements in the Supabase Dashboard -> SQL Editor to immediately lock down your admin data.
