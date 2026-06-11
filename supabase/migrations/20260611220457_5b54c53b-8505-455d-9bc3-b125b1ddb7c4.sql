-- ─── payments: column-level lockdown ─────────────────────────────────────
-- Sensitive columns: gateway internals, fees, split, recipient ids, error message.
REVOKE SELECT (
  gateway_id, gateway_request, gateway_response, error_message,
  seller_recipient_id, platform_recipient_id,
  ticketto_fee, pagarme_fee, tk2_op_fee, transacao_fee,
  split_platform_amount, split_seller_amount
) ON public.payments FROM anon, authenticated;

REVOKE INSERT (
  gateway_id, gateway_request, gateway_response, error_message,
  seller_recipient_id, platform_recipient_id,
  ticketto_fee, pagarme_fee, tk2_op_fee, transacao_fee,
  split_platform_amount, split_seller_amount
) ON public.payments FROM anon, authenticated;

REVOKE UPDATE (
  gateway_id, gateway_request, gateway_response, error_message,
  seller_recipient_id, platform_recipient_id,
  ticketto_fee, pagarme_fee, tk2_op_fee, transacao_fee,
  split_platform_amount, split_seller_amount
) ON public.payments FROM anon, authenticated;

-- ─── tenants: column-level lockdown for banking/fiscal data ──────────────
REVOKE SELECT (
  document, document_type, recipient_id,
  bank_code, bank_agency, bank_account, bank_account_dv, account_type,
  legal_name, holder_name, holder_document,
  recipient_status, recipient_error
) ON public.tenants FROM anon, authenticated;

REVOKE UPDATE (
  document, document_type, recipient_id,
  bank_code, bank_agency, bank_account, bank_account_dv, account_type,
  legal_name, holder_name, holder_document,
  recipient_status, recipient_error
) ON public.tenants FROM anon, authenticated;

-- ─── audit_logs: backend-only writes ─────────────────────────────────────
-- Drop the policy that lets any tenant staff insert audit rows. Only the
-- service_role (server functions, triggers using SECURITY DEFINER) writes audits.
DROP POLICY IF EXISTS audit_staff_insert ON public.audit_logs;