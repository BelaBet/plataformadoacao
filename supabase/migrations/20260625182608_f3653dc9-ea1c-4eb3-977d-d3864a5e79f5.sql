
DROP POLICY IF EXISTS subscription_plans_authenticated_select ON public.subscription_plans;
CREATE POLICY subscription_plans_authenticated_select
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (active = true);
