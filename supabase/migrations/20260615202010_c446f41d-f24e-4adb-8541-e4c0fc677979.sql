ALTER TABLE public.tenants
  DROP COLUMN IF EXISTS bank_code,
  DROP COLUMN IF EXISTS bank_agency,
  DROP COLUMN IF EXISTS bank_account,
  DROP COLUMN IF EXISTS bank_account_dv,
  DROP COLUMN IF EXISTS account_type,
  DROP COLUMN IF EXISTS holder_name,
  DROP COLUMN IF EXISTS holder_document;