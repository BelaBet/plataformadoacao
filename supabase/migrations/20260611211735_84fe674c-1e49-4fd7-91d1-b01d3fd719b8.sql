ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS recipient_id TEXT;

REVOKE SELECT (recipient_id) ON public.tenants FROM anon, authenticated;