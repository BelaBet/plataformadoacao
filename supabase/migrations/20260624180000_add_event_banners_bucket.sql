-- Bucket para banners de evento (upload feito via server function com
-- supabaseAdmin, igual ao padrão já usado para tenant-logos em
-- church.functions.ts). Policies abaixo são defesa em profundidade,
-- caso algum fluxo futuro faça upload direto do client.

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public read event banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-banners');

-- Convenção: arquivos armazenados sob "<tenant_id>/..." (primeira pasta = tenant_id).
CREATE POLICY "event-banners staff insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-banners'
  AND (
    is_platform_admin(auth.uid())
    OR is_tenant_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "event-banners staff update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-banners'
  AND (
    is_platform_admin(auth.uid())
    OR is_tenant_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "event-banners staff delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-banners'
  AND (
    is_platform_admin(auth.uid())
    OR is_tenant_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);
