
-- Revoke column-level SELECT on server-only / sensitive columns

-- cost_centers: split percent columns from anon
REVOKE SELECT (split_platform_percent, split_seller_percent) ON public.cost_centers FROM anon;
REVOKE SELECT (split_platform_percent, split_seller_percent) ON public.cost_centers FROM authenticated;

-- fee_rules: server-only fee columns from authenticated/anon
REVOKE SELECT (acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent) ON public.fee_rules FROM authenticated;
REVOKE SELECT (acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent) ON public.fee_rules FROM anon;

-- payments: server-only columns
REVOKE SELECT (gateway_request, gateway_response, platform_recipient_id, seller_recipient_id, split_platform_amount, split_seller_amount, tk2_op_fee, pagarme_fee) ON public.payments FROM authenticated;
REVOKE SELECT (gateway_request, gateway_response, platform_recipient_id, seller_recipient_id, split_platform_amount, split_seller_amount, tk2_op_fee, pagarme_fee) ON public.payments FROM anon;

-- tenant_bank_account: bank details
REVOKE SELECT (branch, branch_digit, account, account_digit, holder_name, holder_document) ON public.tenant_bank_account FROM authenticated;
REVOKE SELECT (branch, branch_digit, account, account_digit, holder_name, holder_document) ON public.tenant_bank_account FROM anon;

-- tenant_financial_config: server-only columns
REVOKE SELECT (pagarme_recipient_id, pagarme_recipient_status, split_platform_percent, auto_anticipation, anticipation_model, anticipation_days) ON public.tenant_financial_config FROM authenticated;
REVOKE SELECT (pagarme_recipient_id, pagarme_recipient_status, split_platform_percent, auto_anticipation, anticipation_model, anticipation_days) ON public.tenant_financial_config FROM anon;

-- tenants: server-only identity columns
REVOKE SELECT (recipient_id, recipient_status, recipient_error, document, legal_name) ON public.tenants FROM authenticated;
REVOKE SELECT (recipient_id, recipient_status, recipient_error, document, legal_name) ON public.tenants FROM anon;

-- donations: donor PII restricted (already revoked previously, ensure)
REVOKE SELECT (donor_email, donor_phone, donor_document, donor_name) ON public.donations FROM authenticated;
REVOKE SELECT (donor_email, donor_phone, donor_document, donor_name) ON public.donations FROM anon;

-- tenant_payment_settings: pagarme_recipient_id server-only
REVOKE SELECT (pagarme_recipient_id) ON public.tenant_payment_settings FROM authenticated;
REVOKE SELECT (pagarme_recipient_id) ON public.tenant_payment_settings FROM anon;
