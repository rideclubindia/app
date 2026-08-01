-- Early Access Subscribers Table
CREATE TABLE IF NOT EXISTS public.website_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Unsubscribed')),
    source TEXT DEFAULT 'Website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    inquiry_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.website_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (from the website)
CREATE POLICY "Enable insert for anonymous users" ON public.website_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for anonymous users" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "Enable all for authenticated users" ON public.website_subscribers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.contact_messages FOR ALL USING (auth.role() = 'authenticated');
