-- Corrige eventos já criados que ficaram presos como 'draft' por um bug:
-- a tela de cadastro (manage.events.tsx) nunca definia o campo status ao
-- criar um evento, então todos nasciam com o valor padrão da coluna
-- ('draft') e nunca apareciam na página pública de doação. Não existia
-- nenhum controle na tela para marcar um evento como rascunho de
-- propósito — então, com segurança, todo evento hoje em 'draft' é
-- resultado desse bug, não uma escolha intencional da igreja.
UPDATE public.events
SET status = 'active'
WHERE status = 'draft';
