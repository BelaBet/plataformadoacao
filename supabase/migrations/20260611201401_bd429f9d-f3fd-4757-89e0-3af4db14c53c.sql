ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS pagarme_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tk2_op_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transacao_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_brand TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_seller_recipient
  ON public.payments(seller_recipient_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_method_status
  ON public.payments(method, status)
  WHERE deleted_at IS NULL;