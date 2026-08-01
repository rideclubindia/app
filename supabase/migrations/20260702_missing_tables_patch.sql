    -- ============================================================
    -- PATCH: Add missing cms_content and error_logs tables
    -- Run this AFTER the main 00000000_full_schema.sql
    -- ============================================================

    -- 1. CMS_CONTENT TABLE (dynamic app settings, pages)
    CREATE TABLE IF NOT EXISTS public.cms_content (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT,
        slug TEXT UNIQUE,
        content_type TEXT DEFAULT 'page',
        content JSONB,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_cms_content_slug ON public.cms_content(slug);

    ALTER TABLE public.cms_content DISABLE ROW LEVEL SECURITY;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_content TO anon, authenticated;


    -- 2. ERROR_LOGS TABLE (frontend error tracking)
    CREATE TABLE IF NOT EXISTS public.error_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT,
        error_message TEXT,
        error_stack TEXT,
        route TEXT,
        resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.error_logs DISABLE ROW LEVEL SECURITY;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO anon, authenticated;


    -- 3. Enable realtime (Idempotent)
    DO $$
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_content;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.error_logs;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    -- 4. COMMENTS TABLE (incident pin comments)
    CREATE TABLE IF NOT EXISTS public.comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO anon, authenticated;
    
    DO $$
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
