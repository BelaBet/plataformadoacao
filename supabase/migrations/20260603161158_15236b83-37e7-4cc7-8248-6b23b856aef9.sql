DROP POLICY IF EXISTS "Authenticated can read realtime topics they own" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime topics they own"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = ('notifications:' || (auth.uid())::text))
  OR (
    realtime.topic() LIKE 'group_members:%'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE (gm.group_id)::text = split_part(realtime.topic(), ':', 2)
        AND gm.profile_id = auth.uid()
    )
  )
  OR (
    realtime.topic() LIKE 'messages:tenant:%'
    AND split_part(realtime.topic(), ':', 3) = (public.current_tenant_id())::text
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = public.current_tenant_id()
        AND p.status = 'approved'::public.profile_status
    )
  )
  OR (realtime.topic() = ('messages:user:' || (auth.uid())::text))
  OR (
    realtime.topic() LIKE 'messages:group:%'
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE (gm.group_id)::text = split_part(realtime.topic(), ':', 3)
        AND gm.profile_id = auth.uid()
    )
  )
  OR (
    realtime.topic() LIKE '%:staff:%'
    AND public.is_tenant_staff(auth.uid(), (NULLIF(split_part(realtime.topic(), ':', 3), ''))::uuid)
  )
);