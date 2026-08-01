-- Support Center Migration
-- This file creates the tables and RLS policies for the Support & Help Center feature.

-- 1. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open', -- Open, In Progress, Resolved, Closed
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cleanup Old Policies (if they exist)
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view messages of their tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert messages to their tickets" ON public.support_messages;

-- 4. Disable RLS (Using Firebase Auth via Anon Key)
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages DISABLE ROW LEVEL SECURITY;

-- 4. Explicit grants for both anon and authenticated clients
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO anon, authenticated;

-- 5. Realtime
-- Enable realtime for tickets and messages (already executed in DB)
-- alter publication supabase_realtime add table support_tickets;
-- alter publication supabase_realtime add table support_messages;

-- 6. Storage Bucket for Support Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support_attachments', 'support_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Grant access to storage (Anon access since Firebase handles auth)
DROP POLICY IF EXISTS "Anyone can upload support images" ON storage.objects;
CREATE POLICY "Anyone can upload support images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'support_attachments');

DROP POLICY IF EXISTS "Anyone can view support images" ON storage.objects;
CREATE POLICY "Anyone can view support images" ON storage.objects
    FOR SELECT USING (bucket_id = 'support_attachments');
