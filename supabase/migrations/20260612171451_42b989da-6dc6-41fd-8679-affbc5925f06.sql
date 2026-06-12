-- 1. cost_centers: remove anon/authenticated direct read; rely on cost_centers_public view
DROP POLICY IF EXISTS cost_centers_select_active_public ON public.cost_centers;

-- Ensure the public view is invoker-scoped and only exposes safe columns
DROP VIEW IF EXISTS public.cost_centers_public;
CREATE VIEW public.cost_centers_public
WITH (security_invoker = true)
AS
SELECT id, tenant_id, name, slug, type, description, qr_code_url, display_order
FROM public.cost_centers
WHERE is_active = true;

GRANT SELECT ON public.cost_centers_public TO anon, authenticated;

-- 2. donations: revoke donor PII columns from anon/authenticated; server (service_role) only
REVOKE SELECT (donor_name, donor_document, donor_phone, donor_email)
  ON public.donations FROM anon, authenticated;

-- 3. payments: drop self-insert policy (server-side via service_role only)
DROP POLICY IF EXISTS payments_insert_self ON public.payments;

-- 4. tickets: drop self-insert policy (server-side via service_role only)
DROP POLICY IF EXISTS tickets_insert_self ON public.tickets;