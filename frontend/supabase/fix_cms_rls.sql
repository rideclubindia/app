-- Enable RLS if not already enabled
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

-- Create a policy allowing anyone to read published CMS content or app settings
CREATE POLICY "Allow public read access to cms_content"
ON public.cms_content
FOR SELECT
USING (is_published = true OR slug = 'app-settings');
