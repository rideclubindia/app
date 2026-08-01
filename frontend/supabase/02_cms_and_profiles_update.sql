-- 1. Create CMS Policies Table
CREATE TABLE IF NOT EXISTS public.cms_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('privacy', 'terms')),
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cms_policies
ALTER TABLE public.cms_policies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published policies
CREATE POLICY "Public can view published policies"
  ON public.cms_policies FOR SELECT
  USING (is_published = true);

-- Allow authenticated admins to manage all policies
CREATE POLICY "Admins can manage policies"
  ON public.cms_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert initial dummy records so the app doesn't break
INSERT INTO public.cms_policies (type, content, version, is_published)
VALUES 
('privacy', '# Privacy Policy\n\nInitial version loaded from migration.', 1, true),
('terms', '# Terms & Conditions\n\nInitial version loaded from migration.', 1, true);

-- 2. Modify Profiles Table
-- Add role column if it doesn't exist (assuming it might not exist or needs explicit definition)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='accepted_privacy_version') THEN
    ALTER TABLE public.profiles ADD COLUMN accepted_privacy_version INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='accepted_terms_version') THEN
    ALTER TABLE public.profiles ADD COLUMN accepted_terms_version INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='policy_accepted_at') THEN
    ALTER TABLE public.profiles ADD COLUMN policy_accepted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_ip_address') THEN
    ALTER TABLE public.profiles ADD COLUMN last_ip_address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='device_info') THEN
    ALTER TABLE public.profiles ADD COLUMN device_info TEXT;
  END IF;
END $$;

-- Update RLS for profiles to allow users to update their own policy acceptance
-- (Assuming an existing policy allows update on auth.uid() = id)
