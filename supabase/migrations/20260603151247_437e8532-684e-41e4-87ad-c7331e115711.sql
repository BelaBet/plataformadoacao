
-- Unicidade de e-mail entre instituições
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL;

-- RPC para verificar se um e-mail já está cadastrado em outra conta/instituição.
-- Retorna true se o e-mail existir em profiles e pertencer a outro usuário.
CREATE OR REPLACE FUNCTION public.is_email_registered(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(email) = lower(_email)
      AND (auth.uid() IS NULL OR id <> auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_email_registered(text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_email_registered(text) TO anon, authenticated;
