-- 1. Restrict subscription_plans: remove broad authenticated read
DROP POLICY IF EXISTS subscription_plans_authenticated_select ON public.subscription_plans;

-- 2. current_tenant_id: require validated claim; no arbitrary fallback
CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _claim_tenant uuid;
  _result uuid;
  _profile_count int;
BEGIN
  BEGIN
    _claim_tenant := NULLIF(
      ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata') ->> 'tenant_id'),
      ''
    )::uuid;
  EXCEPTION WHEN others THEN
    _claim_tenant := NULL;
  END;

  IF _claim_tenant IS NOT NULL THEN
    SELECT tenant_id INTO _result
    FROM public.profiles
    WHERE id = auth.uid() AND tenant_id = _claim_tenant
    LIMIT 1;
    RETURN _result; -- NULL if claim doesn't match a real membership
  END IF;

  -- No claim: only auto-resolve when user belongs to exactly one tenant.
  SELECT count(DISTINCT tenant_id) INTO _profile_count
  FROM public.profiles
  WHERE id = auth.uid();

  IF _profile_count = 1 THEN
    SELECT tenant_id INTO _result
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN _result;
  END IF;

  RETURN NULL;
END;
$function$;