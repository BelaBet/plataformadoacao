
DO $$ BEGIN
  CREATE TYPE public.cost_center_type AS ENUM ('online', 'presencial', 'totem');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  type public.cost_center_type NOT NULL DEFAULT 'online',
  description text,
  split_platform_percent numeric(5,4) NOT NULL DEFAULT 0.0415 CHECK (split_platform_percent >= 0 AND split_platform_percent <= 1),
  split_seller_percent numeric(5,4) NOT NULL DEFAULT 0.9585 CHECK (split_seller_percent >= 0 AND split_seller_percent <= 1),
  allows_installments boolean NOT NULL DEFAULT true,
  max_installments int NOT NULL DEFAULT 12 CHECK (max_installments >= 1 AND max_installments <= 12),
  is_active boolean NOT NULL DEFAULT true,
  qr_code_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cost_centers_split_sum CHECK (abs((split_platform_percent + split_seller_percent) - 1) < 0.0001),
  CONSTRAINT cost_centers_slug_unique UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS cost_centers_tenant_idx ON public.cost_centers(tenant_id);
CREATE INDEX IF NOT EXISTS cost_centers_active_idx ON public.cost_centers(tenant_id, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;
GRANT SELECT ON public.cost_centers TO anon;
GRANT ALL ON public.cost_centers TO service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS cost_centers_set_updated_at ON public.cost_centers;
CREATE TRIGGER cost_centers_set_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.cost_centers_protect_sensitive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.split_platform_percent IS DISTINCT FROM OLD.split_platform_percent
     OR NEW.split_seller_percent IS DISTINCT FROM OLD.split_seller_percent
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.max_installments IS DISTINCT FROM OLD.max_installments
     OR NEW.allows_installments IS DISTINCT FROM OLD.allows_installments
     OR NEW.qr_code_url IS DISTINCT FROM OLD.qr_code_url THEN
    RAISE EXCEPTION 'Apenas super admin pode alterar configurações sensíveis do centro de custo.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS cost_centers_protect_sensitive_trg ON public.cost_centers;
CREATE TRIGGER cost_centers_protect_sensitive_trg
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.cost_centers_protect_sensitive();

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cost_centers_select_active_public ON public.cost_centers;
CREATE POLICY cost_centers_select_active_public ON public.cost_centers
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS cost_centers_select_staff ON public.cost_centers;
CREATE POLICY cost_centers_select_staff ON public.cost_centers
  FOR SELECT TO authenticated
  USING (public.is_tenant_staff(auth.uid(), tenant_id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS cost_centers_super_admin_all ON public.cost_centers;
CREATE POLICY cost_centers_super_admin_all ON public.cost_centers
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS cost_centers_church_admin_update ON public.cost_centers;
CREATE POLICY cost_centers_church_admin_update ON public.cost_centers
  FOR UPDATE TO authenticated
  USING (public.is_tenant_staff(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_staff(auth.uid(), tenant_id));

CREATE OR REPLACE VIEW public.cost_centers_public AS
SELECT cc.id, cc.tenant_id, cc.name, cc.slug, cc.type, cc.description,
       cc.allows_installments, cc.max_installments, cc.display_order
FROM public.cost_centers cc
WHERE cc.is_active = true;

GRANT SELECT ON public.cost_centers_public TO anon, authenticated;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_cost_center_idx ON public.payments(cost_center_id);
