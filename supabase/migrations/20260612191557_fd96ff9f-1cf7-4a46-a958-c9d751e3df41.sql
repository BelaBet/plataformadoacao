
-- Restrict internal fee/split fields in cost_centers
REVOKE SELECT (split_platform_percent, split_seller_percent) ON public.cost_centers FROM authenticated, anon;

-- Restrict internal platform margin fields in fee_rules
REVOKE SELECT (acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent) ON public.fee_rules FROM authenticated, anon;

-- Banking data is server-only: revoke all SELECT from client roles
REVOKE SELECT ON public.tenant_bank_account FROM authenticated, anon;

-- Tighten tenant_legal_responsible write policies to admin / platform admin only
DROP POLICY IF EXISTS legal_resp_staff_insert ON public.tenant_legal_responsible;
DROP POLICY IF EXISTS legal_resp_staff_update ON public.tenant_legal_responsible;
DROP POLICY IF EXISTS legal_resp_staff_delete ON public.tenant_legal_responsible;

CREATE POLICY legal_resp_admin_insert ON public.tenant_legal_responsible
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), tenant_id, 'admin'::app_role) OR is_platform_admin(auth.uid()));

CREATE POLICY legal_resp_admin_update ON public.tenant_legal_responsible
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), tenant_id, 'admin'::app_role) OR is_platform_admin(auth.uid()))
  WITH CHECK (has_role(auth.uid(), tenant_id, 'admin'::app_role) OR is_platform_admin(auth.uid()));

CREATE POLICY legal_resp_admin_delete ON public.tenant_legal_responsible
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), tenant_id, 'admin'::app_role) OR is_platform_admin(auth.uid()));
