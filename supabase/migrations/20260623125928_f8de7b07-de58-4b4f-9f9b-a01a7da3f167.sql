
-- 1) Column-level REVOKE on sensitive server-only columns
REVOKE SELECT (split_platform_percent, split_seller_percent) ON public.cost_centers FROM authenticated, anon;

REVOKE SELECT (acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent) ON public.fee_rules FROM authenticated, anon;

REVOKE SELECT (gateway_request, gateway_response, platform_recipient_id, seller_recipient_id, split_platform_amount, split_seller_amount, tk2_op_fee, pagarme_fee) ON public.payments FROM authenticated, anon;

REVOKE SELECT (branch, branch_digit, account, account_digit, holder_name, holder_document) ON public.tenant_bank_account FROM authenticated, anon;

REVOKE SELECT (pagarme_recipient_id, pagarme_recipient_status, split_platform_percent, auto_anticipation, anticipation_model, anticipation_days) ON public.tenant_financial_config FROM authenticated, anon;

REVOKE SELECT (recipient_id, recipient_status, recipient_error, document, legal_name) ON public.tenants FROM authenticated, anon;

-- 2) Anon SELECT policy on cost_centers for public donation page
GRANT SELECT (id, tenant_id, name, slug, type, description, allows_installments, max_installments, is_active, qr_code_url, display_order, created_at, updated_at) ON public.cost_centers TO anon;

DROP POLICY IF EXISTS cost_centers_anon_public_select ON public.cost_centers;
CREATE POLICY cost_centers_anon_public_select
  ON public.cost_centers
  FOR SELECT
  TO anon
  USING (is_active = true);

-- 3) current_tenant_id() honors explicit tenant from JWT app_metadata when available
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _claim_tenant uuid;
  _result uuid;
BEGIN
  BEGIN
    _claim_tenant := NULLIF(
      ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata') ->> 'tenant_id'),
      ''
    )::uuid;
  EXCEPTION WHEN others THEN
    _claim_tenant := NULL;
  END;

  IF _claim_tenant IS NOT NULL THEN
    SELECT tenant_id INTO _result
    FROM public.profiles
    WHERE id = auth.uid() AND tenant_id = _claim_tenant
    LIMIT 1;
    IF _result IS NOT NULL THEN
      RETURN _result;
    END IF;
  END IF;

  SELECT tenant_id INTO _result
  FROM public.profiles
  WHERE id = auth.uid()
  ORDER BY tenant_id
  LIMIT 1;
  RETURN _result;
END;
$$;
