
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

UPDATE public.events
  SET external_url = 'https://www.ticketto.com.br/'
  WHERE external_url IS NULL;

ALTER TABLE public.events
  ALTER COLUMN external_url SET NOT NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_external_url_format_chk;

ALTER TABLE public.events
  ADD CONSTRAINT events_external_url_format_chk
  CHECK (external_url ~* '^https?://[^[:space:]]+$');
