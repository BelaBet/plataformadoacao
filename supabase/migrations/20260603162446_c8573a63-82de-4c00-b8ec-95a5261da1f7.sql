-- 1) Remove the over-permissive public policy
DROP POLICY IF EXISTS tenants_public_branding_select ON public.tenants;

-- 2) Recreate the view as SECURITY DEFINER (default) so it can read the base
--    table without granting public SELECT on tenants. Only branding columns
--    are exposed.
DROP VIEW IF EXISTS public.tenants_public;

CREATE VIEW public.tenants_public AS
SELECT
  id,
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  custom_domain,
  tagline,
  cover_photo_url,
  active
FROM public.tenants
WHERE deleted_at IS NULL AND active = true;

-- The view runs with the owner's rights (postgres) and exposes only the
-- columns above. Grant read access explicitly.
GRANT SELECT ON public.tenants_public TO anon, authenticated;