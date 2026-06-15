
-- Defense-in-depth: revoke table-level SELECT from authenticated/anon on tables with sensitive columns,
-- then re-grant SELECT only on non-sensitive columns. service_role retains full access.

-- =========================================================
-- cost_centers: hide split_platform_percent, split_seller_percent
-- =========================================================
REVOKE SELECT ON public.cost_centers FROM authenticated, anon;
GRANT SELECT (
  id, tenant_id, name, slug, type, description,
  allows_installments, max_installments, is_active,
  qr_code_url, display_order, created_at, updated_at
) ON public.cost_centers TO authenticated, anon;

-- =========================================================
-- fee_rules: hide acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent
-- =========================================================
REVOKE SELECT ON public.fee_rules FROM authenticated, anon;
GRANT SELECT (
  id, tenant_id, payment_method, anticipation_percent,
  transaction_fixed, who_pays, is_active, created_at
) ON public.fee_rules TO authenticated;

-- =========================================================
-- tenant_financial_config: hide pagarme_recipient_id/status, split_platform_percent,
-- auto_anticipation, anticipation_model, anticipation_days
-- =========================================================
REVOKE SELECT ON public.tenant_financial_config FROM authenticated, anon;
GRANT SELECT (
  id, tenant_id, receiver_type, use_pagarme,
  auto_transfer, transfer_frequency, created_at, updated_at
) ON public.tenant_financial_config TO authenticated;

-- =========================================================
-- tenants: hide recipient_id, recipient_status, recipient_error, document, legal_name
-- =========================================================
REVOKE SELECT ON public.tenants FROM authenticated, anon;
GRANT SELECT (
  id, name, slug, logo_url, primary_color, secondary_color, custom_domain,
  active, created_at, tagline, cover_photo_url, accent_color,
  deleted_at, deleted_by, document_type, trade_name,
  institutional_email, main_phone, website, description,
  compliance_status, financial_active, updated_at
) ON public.tenants TO authenticated;
GRANT SELECT (
  id, name, slug, logo_url, primary_color, secondary_color, custom_domain,
  active, tagline, cover_photo_url, accent_color, trade_name,
  institutional_email, main_phone, website, description
) ON public.tenants TO anon;

-- =========================================================
-- payments: hide gateway_request/response, *recipient_id, split_*_amount, tk2_op_fee, pagarme_fee
-- =========================================================
REVOKE SELECT ON public.payments FROM authenticated, anon;
GRANT SELECT (
  id, tenant_id, profile_id, amount, method, status,
  reference_type, reference_id, gateway_id,
  created_at, deleted_at, deleted_by,
  donation_amount, ticketto_fee, error_message,
  transacao_fee, card_brand, cost_center_id
) ON public.payments TO authenticated;

-- =========================================================
-- tenant_bank_account: all banking detail columns are sensitive — only expose id/tenant_id metadata
-- =========================================================
REVOKE SELECT ON public.tenant_bank_account FROM authenticated, anon;
GRANT SELECT (
  id, tenant_id, bank_code, account_type, created_at, updated_at
) ON public.tenant_bank_account TO authenticated;
