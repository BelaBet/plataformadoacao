-- tenants: revoke sensitive columns from anon/authenticated; service_role keeps full access
REVOKE SELECT (recipient_id, recipient_status, recipient_error, document, legal_name)
  ON public.tenants FROM authenticated;
REVOKE SELECT (recipient_id, recipient_status, recipient_error, document, legal_name)
  ON public.tenants FROM anon;

-- tenant_bank_account: full bank holder data is server-only
REVOKE SELECT (bank_code, branch, branch_digit, account, account_digit, account_type, holder_name, holder_document)
  ON public.tenant_bank_account FROM authenticated;
REVOKE SELECT (bank_code, branch, branch_digit, account, account_digit, account_type, holder_name, holder_document)
  ON public.tenant_bank_account FROM anon;

-- tenant_financial_config: gateway + split + anticipation are server-only
REVOKE SELECT (pagarme_recipient_id, pagarme_recipient_status, split_platform_percent, auto_anticipation, anticipation_model, anticipation_days)
  ON public.tenant_financial_config FROM authenticated;
REVOKE SELECT (pagarme_recipient_id, pagarme_recipient_status, split_platform_percent, auto_anticipation, anticipation_model, anticipation_days)
  ON public.tenant_financial_config FROM anon;

-- tenant_payment_settings: pix_key stays visible, recipient ID is server-only
REVOKE SELECT (pagarme_recipient_id) ON public.tenant_payment_settings FROM authenticated;
REVOKE SELECT (pagarme_recipient_id) ON public.tenant_payment_settings FROM anon;

-- cost_centers: split percentages are server-only
REVOKE SELECT (split_platform_percent, split_seller_percent) ON public.cost_centers FROM authenticated;
REVOKE SELECT (split_platform_percent, split_seller_percent) ON public.cost_centers FROM anon;

-- fee_rules: internal fee structure is server-only
REVOKE SELECT (acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent) ON public.fee_rules FROM authenticated;
REVOKE SELECT (acquirer_fee_percent, tk2_op_fixed, tk2_op_percent, adm_fee_percent) ON public.fee_rules FROM anon;