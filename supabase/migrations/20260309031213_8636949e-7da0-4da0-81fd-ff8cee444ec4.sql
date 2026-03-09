CREATE POLICY "Public can read site settings"
ON public.app_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('site_title', 'site_meta_description', 'site_favicon_url'));