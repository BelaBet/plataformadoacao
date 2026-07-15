
-- 1) Fix SECURITY DEFINER view: tenants_public should use invoker's RLS
ALTER VIEW public.tenants_public SET (security_invoker = true);

-- 2) Block tenant staff from changing sensitive columns via triggers
-- cost_centers: only platform admins may change split percents & platform-controlled fields
CREATE OR REPLACE FUNCTION public.cost_centers_protect_sensitive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.split_platform_percent IS DISTINCT FROM OLD.split_platform_percent
     OR NEW.split_seller_percent IS DISTINCT FROM OLD.split_seller_percent
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.max_installments IS DISTINCT FROM OLD.max_installments
     OR NEW.allows_installments IS DISTINCT FROM OLD.allows_installments THEN
    RAISE EXCEPTION 'Apenas super admin pode alterar configurações sensíveis do centro de custo.';
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS cost_centers_protect_sensitive_trg ON public.cost_centers;
CREATE TRIGGER cost_centers_protect_sensitive_trg
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.cost_centers_protect_sensitive();

-- 3) tenant_financial_config: block staff from changing split/recipient/anticipation fields
CREATE OR REPLACE FUNCTION public.tenant_financial_config_protect_sensitive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.split_platform_percent IS NOT NULL
       OR NEW.pagarme_recipient_id IS NOT NULL
       OR NEW.pagarme_recipient_status IS NOT NULL
       OR NEW.auto_anticipation IS DISTINCT FROM false
       OR NEW.anticipation_model IS NOT NULL
       OR NEW.anticipation_days IS NOT NULL THEN
      RAISE EXCEPTION 'Apenas super admin pode definir campos financeiros controlados pela plataforma.';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.split_platform_percent IS DISTINCT FROM OLD.split_platform_percent
     OR NEW.pagarme_recipient_id IS DISTINCT FROM OLD.pagarme_recipient_id
     OR NEW.pagarme_recipient_status IS DISTINCT FROM OLD.pagarme_recipient_status
     OR NEW.auto_anticipation IS DISTINCT FROM OLD.auto_anticipation
     OR NEW.anticipation_model IS DISTINCT FROM OLD.anticipation_model
     OR NEW.anticipation_days IS DISTINCT FROM OLD.anticipation_days THEN
    RAISE EXCEPTION 'Apenas super admin pode alterar campos financeiros controlados pela plataforma.';
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS tenant_financial_config_protect_sensitive_trg ON public.tenant_financial_config;
CREATE TRIGGER tenant_financial_config_protect_sensitive_trg
  BEFORE INSERT OR UPDATE ON public.tenant_financial_config
  FOR EACH ROW EXECUTE FUNCTION public.tenant_financial_config_protect_sensitive();

-- 4) tenants: block admins from self-approving compliance/financial/recipient status
CREATE OR REPLACE FUNCTION public.tenants_protect_sensitive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_platform_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.compliance_status IS DISTINCT FROM OLD.compliance_status
     OR NEW.financial_active IS DISTINCT FROM OLD.financial_active
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.recipient_status IS DISTINCT FROM OLD.recipient_status
     OR NEW.recipient_error IS DISTINCT FROM OLD.recipient_error
     OR NEW.document IS DISTINCT FROM OLD.document
     OR NEW.legal_name IS DISTINCT FROM OLD.legal_name
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.active IS DISTINCT FROM OLD.active
     OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by
     OR NEW.custom_domain IS DISTINCT FROM OLD.custom_domain THEN
    RAISE EXCEPTION 'Apenas super admin pode alterar status financeiro/compliance ou identificadores da instituição.';
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS tenants_protect_sensitive_trg ON public.tenants;
CREATE TRIGGER tenants_protect_sensitive_trg
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.tenants_protect_sensitive();

-- 5) platform_settings: restrict SELECT to platform admins
DROP POLICY IF EXISTS settings_select_authenticated ON public.platform_settings;
CREATE POLICY settings_select_platform_admin ON public.platform_settings
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- 6) Public bucket listing: drop broad SELECT policies. Public URLs continue to work.
DROP POLICY IF EXISTS "Public read tenant logos" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "event_banners_public_read" ON storage.objects;

-- 7) Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions that are
--    only invoked by triggers or by backend/service_role code (never called directly
--    from client SQL/RPC). Functions used inside RLS policies (has_role, is_*,
--    current_tenant_id, get_tenant_pix_key) keep authenticated EXECUTE because
--    RLS evaluation needs them.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_critical_action()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recompute_compliance()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cost_centers_protect_sensitive()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tenant_financial_config_protect_sensitive() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tenants_protect_sensitive()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_tenant_compliance(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_tenant_pending_documents(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_email_registered(text)                FROM PUBLIC, anon, authenticated;
