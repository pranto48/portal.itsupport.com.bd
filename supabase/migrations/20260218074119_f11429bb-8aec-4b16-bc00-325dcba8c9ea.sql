
-- App settings table for storing configurable values like license endpoint URL
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read settings"
ON public.app_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.app_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.app_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role (edge functions) to read settings without auth
-- This is handled by using service_role key in the edge function

-- Insert default license endpoint URL
INSERT INTO public.app_settings (key, value, description)
VALUES ('license_endpoint_url', '', 'The active license verification endpoint URL used by Docker apps');

-- Create a license_verification_log table for security auditing
CREATE TABLE public.license_verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key_hash text NOT NULL,
  ip_address text,
  installation_id text,
  result text NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS - only admins can view logs
ALTER TABLE public.license_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view verification logs"
ON public.license_verification_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No public insert policy - edge function uses service_role key
