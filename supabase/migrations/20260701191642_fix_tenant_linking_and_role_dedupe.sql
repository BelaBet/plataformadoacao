-- ============================================================================
-- Fix: novos usuários podiam ser vinculados silenciosamente a um tenant
-- já existente (fallback para slug 'default'), e um mesmo usuário podia
-- acumular mais de um papel (role) no mesmo tenant (ex: member + admin).
-- ============================================================================

-- 1) Dedupe: para cada (user_id, tenant_id) com mais de uma role, mantém
--    apenas a de maior privilégio (admin > manager > member).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, tenant_id
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'member' THEN 3
      END
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2) Aperta a constraint: um usuário só pode ter UM papel por tenant.
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_user_id_tenant_id_role_key;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_tenant_id_key UNIQUE (user_id, tenant_id);

-- 3) handle_new_user: falha fechado em vez de falha aberto.
--    Antes: se tenant_id não viesse no metadata, caía num tenant "default"
--    qualquer, silenciosamente. Agora: bloqueia o cadastro com erro claro.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
  _role public.app_role;
  _status public.profile_status;
  _meta_tenant_id text;
BEGIN
  _meta_tenant_id := NEW.raw_user_meta_data->>'tenant_id';

  IF _meta_tenant_id IS NULL OR _meta_tenant_id = '' THEN
    RAISE EXCEPTION
      'Cadastro bloqueado: tenant_id ausente no metadata do usuário (email=%). Nenhum vínculo automático é permitido.',
      NEW.email;
  END IF;

  BEGIN
    _tenant_id := _meta_tenant_id::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION
      'Cadastro bloqueado: tenant_id inválido no metadata (%) para o usuário %.',
      _meta_tenant_id, NEW.email;
  END;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE id = _tenant_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cadastro bloqueado: tenant_id % não existe ou foi removido (usuário %).',
      _tenant_id, NEW.email;
  END IF;

  IF (NEW.raw_user_meta_data->>'is_tenant_founder')::boolean IS TRUE THEN
    _role := 'admin'::public.app_role;
    _status := 'approved'::public.profile_status;
  ELSE
    _role := 'member'::public.app_role;
    _status := 'pending'::public.profile_status;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, full_name, email, phone, lgpd_consent, lgpd_consent_at, status)
  VALUES (
    NEW.id,
    _tenant_id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'lgpd_consent')::boolean, false),
    CASE WHEN (NEW.raw_user_meta_data->>'lgpd_consent')::boolean THEN now() ELSE NULL END,
    _status
  );

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, _tenant_id, _role)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$function$;

-- Trigger continua a mesma, só garantindo que aponta pra função atualizada.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
