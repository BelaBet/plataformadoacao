-- Restrict public access to tenants table: drop broad anon/authenticated SELECT
-- policy that exposed sensitive columns (document, document_type, deleted_at, deleted_by).
-- Public discovery happens through the tenants_public view, which only exposes
-- safe columns. Switch view to SECURITY DEFINER so it can be queried without
-- direct RLS access to the base table.

DROP POLICY IF EXISTS tenants_public_discovery ON public.tenants;

ALTER VIEW public.tenants_public SET (security_invoker = false);

GRANT SELECT ON public.tenants_public TO anon, authenticated;