DROP POLICY IF EXISTS bank_staff_write ON public.tenant_bank_account;

CREATE POLICY bank_admin_read ON public.tenant_bank_account
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY bank_admin_write ON public.tenant_bank_account
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY bank_admin_update ON public.tenant_bank_account
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY bank_admin_delete ON public.tenant_bank_account
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), tenant_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );