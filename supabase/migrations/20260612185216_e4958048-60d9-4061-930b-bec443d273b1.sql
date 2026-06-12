-- 1. donations: revoke sensitive column reads from clients (server uses service_role which bypasses).
REVOKE SELECT (donor_name, donor_email, donor_phone, donor_document, card_brand, card_last_four, gateway_id)
  ON public.donations FROM authenticated, anon;

-- 2. payments: revoke gateway/recipient column reads from clients.
REVOKE SELECT (platform_recipient_id, seller_recipient_id, gateway_id, gateway_request, gateway_response)
  ON public.payments FROM authenticated, anon;

-- 3. tenants: revoke banking/legal/identity column reads from clients.
REVOKE SELECT (recipient_id, holder_document, holder_name, legal_name, bank_code, bank_account, bank_agency, bank_account_dv, institutional_email, document)
  ON public.tenants FROM authenticated, anon;

-- 4. tenant_financial_config: split ALL into write-only for staff + SELECT for platform admin only.
DROP POLICY IF EXISTS fin_cfg_staff_write ON public.tenant_financial_config;
CREATE POLICY fin_cfg_staff_insert ON public.tenant_financial_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_staff(auth.uid(), tenant_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY fin_cfg_staff_update ON public.tenant_financial_config
  FOR UPDATE TO authenticated
  USING (public.is_tenant_staff(auth.uid(), tenant_id) OR public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_tenant_staff(auth.uid(), tenant_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY fin_cfg_staff_delete ON public.tenant_financial_config
  FOR DELETE TO authenticated
  USING (public.is_tenant_staff(auth.uid(), tenant_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY fin_cfg_platform_select ON public.tenant_financial_config
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- 5. tenant_legal_responsible: restrict SELECT to tenant admin (not manager) + platform admin.
DROP POLICY IF EXISTS legal_resp_staff_select ON public.tenant_legal_responsible;
CREATE POLICY legal_resp_admin_select ON public.tenant_legal_responsible
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), tenant_id, 'admin'::app_role) OR public.is_platform_admin(auth.uid()));

-- 6. user_roles: prevent tenant admins from granting/elevating to admin role; only platform admins can manage 'admin' role.
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_tenant_admin_manage_nonadmin ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR (
      tenant_id = public.current_tenant_id()
      AND public.has_role(auth.uid(), tenant_id, 'admin'::app_role)
      AND role <> 'admin'::app_role
      AND user_id <> auth.uid()
    )
  )
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR (
      tenant_id = public.current_tenant_id()
      AND public.has_role(auth.uid(), tenant_id, 'admin'::app_role)
      AND role <> 'admin'::app_role
      AND user_id <> auth.uid()
    )
  );

-- 7. cost_centers: add explicit tenant staff SELECT policy on base table.
CREATE POLICY cost_centers_tenant_staff_select ON public.cost_centers
  FOR SELECT TO authenticated
  USING (public.is_tenant_staff(auth.uid(), tenant_id) OR public.is_platform_admin(auth.uid()));