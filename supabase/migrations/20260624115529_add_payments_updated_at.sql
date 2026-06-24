-- Adiciona updated_at em payments (faltava; só havia created_at).
-- Necessário para a tela de detalhe de doação mostrar "Atualizado em".
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Reaproveita a função genérica já usada por outras tabelas (ex.: cost_centers).
DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Libera a nova coluna na mesma lista restrita de SELECT já aplicada a
-- authenticated (ver migration 20260623165452), sem expor gateway_request/
-- gateway_response/colunas de split que continuam bloqueadas.
REVOKE SELECT ON public.payments FROM authenticated;
GRANT SELECT (
  id, tenant_id, profile_id, amount, method, status, reference_type, reference_id,
  gateway_id, created_at, updated_at, deleted_at, deleted_by, donation_amount, ticketto_fee,
  error_message, transacao_fee, card_brand, cost_center_id
) ON public.payments TO authenticated;
REVOKE SELECT ON public.payments FROM anon;
