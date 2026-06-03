-- 1) Restrict tenants.pix_key from being read via the public SELECT policy
REVOKE SELECT (pix_key) ON public.tenants FROM anon, authenticated, PUBLIC;
-- service_role keeps full access; pix_key remains accessible via get_tenant_pix_key()

-- 2) Tighten groups visibility: only members of the group or tenant staff
DROP POLICY IF EXISTS groups_tenant_select ON public.groups;
CREATE POLICY groups_member_or_staff_select ON public.groups
FOR SELECT
USING (
  is_tenant_staff(auth.uid(), tenant_id)
  OR is_platform_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.profile_id = auth.uid()
  )
);

-- 3) tenant-logos storage bucket: add write policies (staff/admin of the tenant only).
-- Convention: files stored under "<tenant_id>/..." (first folder = tenant_id).
CREATE POLICY "tenant-logos staff insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (
    is_platform_admin(auth.uid())
    OR is_tenant_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "tenant-logos staff update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tenant-logos'
  AND (
    is_platform_admin(auth.uid())
    OR is_tenant_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "tenant-logos staff delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tenant-logos'
  AND (
    is_platform_admin(auth.uid())
    OR is_tenant_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
