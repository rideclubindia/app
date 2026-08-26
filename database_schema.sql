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

-- Rides Table
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    polyline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ride Events (GPS track / actions)
CREATE TABLE IF NOT EXISTS public.ride_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Navigations Table
CREATE TABLE IF NOT EXISTS public.navigations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    destination_name TEXT,
    status TEXT DEFAULT 'navigating' CHECK (status IN ('navigating', 'arrived', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.rides FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.ride_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.navigations FOR ALL USING (auth.role() = 'authenticated');
