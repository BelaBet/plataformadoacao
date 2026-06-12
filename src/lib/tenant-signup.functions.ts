import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Onboarding completo de um tenant (igreja).
// Aceita campos mínimos (compatível com self-signup) e campos completos
// para provisionamento via super admin / fluxo administrativo.

const BrandingSchema = z
  .object({
    logo_url: z.string().url().max(500).optional(),
    cover_photo_url: z.string().url().max(500).optional(),
    primary_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Cor primária deve ser HEX #RRGGBB")
      .optional(),
    secondary_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Cor secundária deve ser HEX #RRGGBB")
      .optional(),
    accent_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Cor de destaque deve ser HEX #RRGGBB")
      .optional(),
    tagline: z.string().trim().max(200).optional(),
  })
  .partial();

const AdminSchema = z
  .object({
    email: z.string().trim().email().max(160),
    full_name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().min(8).max(20).optional(),
  })
  .optional();

const InputSchema = z.object({
  church_name: z.string().trim().min(2).max(120),
  document: z.string().trim().min(11).max(20),
  document_type: z.enum(["cnpj", "cpf"]),

  // Pagar.me
  pagarme_recipient_id: z
    .string()
    .trim()
    .regex(/^rp_[A-Za-z0-9]+$/, "pagarme_recipient_id inválido")
    .optional(),
  split_platform_percent: z
    .number()
    .min(0)
    .max(1)
    .optional(), // ex.: 0.0415 = 4,15%

  // Branding
  branding: BrandingSchema.optional(),

  // Admin (opcional — quando provisionado via super admin)
  admin: AdminSchema,
});

type Input = z.infer<typeof InputSchema>;

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

async function validatePagarmeRecipient(recipientId: string): Promise<void> {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error("PAGARME_SECRET_KEY não configurada");
  const auth = "Basic " + Buffer.from(`${key}:`).toString("base64");
  const res = await fetch(`https://api.pagar.me/core/v5/recipients/${encodeURIComponent(recipientId)}`, {
    headers: { Authorization: auth },
  });
  if (res.status === 404) throw new Error("pagarme_recipient_id não encontrado na Pagar.me");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha ao validar recipient na Pagar.me (${res.status}): ${body.slice(0, 200)}`);
  }
  const json: any = await res.json().catch(() => null);
  const status: string = json?.status ?? "";
  if (status && status !== "registered" && status !== "active" && status !== "approved") {
    throw new Error(`Recipient com status inválido na Pagar.me: ${status}`);
  }
}

async function generateQrDataUrl(url: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
}

export const reserveTenantForSignup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }: { data: Input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const onlyDigits = data.document.replace(/\D/g, "");

    // 0. Documento já cadastrado?
    const { data: existing, error: exErr } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("document", onlyDigits)
      .is("deleted_at", null)
      .maybeSingle();
    if (exErr) throw new Error(exErr.message);
    if (existing) {
      throw new Error("Esta instituição já está cadastrada. Peça um convite ao administrador.");
    }

    // 1+2. Slug único a partir do nome
    const base = slugify(data.church_name) || `igreja-${Date.now()}`;
    let slug = base;
    for (let i = 1; i < 50; i++) {
      const { data: clash } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }

    // 5 (pré-criação). Validar Pagar.me recipient ANTES de gravar nada
    if (data.pagarme_recipient_id) {
      await validatePagarmeRecipient(data.pagarme_recipient_id);
    }

    // 3+4. Criar tenant com branding
    const branding = data.branding ?? {};
    const tenantInsert: Record<string, unknown> = {
      name: data.church_name,
      slug,
      document: onlyDigits,
      document_type: data.document_type,
      active: true,
    };
    if (branding.logo_url) tenantInsert.logo_url = branding.logo_url;
    if (branding.cover_photo_url) tenantInsert.cover_photo_url = branding.cover_photo_url;
    if (branding.primary_color) tenantInsert.primary_color = branding.primary_color;
    if (branding.secondary_color) tenantInsert.secondary_color = branding.secondary_color;
    if (branding.accent_color) tenantInsert.accent_color = branding.accent_color;
    if (branding.tagline) tenantInsert.tagline = branding.tagline;

    const { data: created, error: cErr } = await supabaseAdmin
      .from("tenants")
      .insert(tenantInsert as any)
      .select("id")
      .single();
    if (cErr || !created) {
      throw new Error(cErr?.message || "Falha ao criar a instituição.");
    }
    const tenantId = created.id as string;

    // 5. Salvar pagarme_recipient_id em tenant_payment_settings
    if (data.pagarme_recipient_id) {
      const { error: pErr } = await supabaseAdmin
        .from("tenant_payment_settings")
        .upsert(
          { tenant_id: tenantId, pagarme_recipient_id: data.pagarme_recipient_id },
          { onConflict: "tenant_id" },
        );
      if (pErr) throw new Error(`Falha ao salvar Pagar.me: ${pErr.message}`);
    }

    // 6. Cost center "Online" padrão
    const splitPlatform =
      typeof data.split_platform_percent === "number" ? data.split_platform_percent : 0.0415;
    const splitSeller = Number((1 - splitPlatform).toFixed(6));
    const { data: cc, error: ccErr } = await supabaseAdmin
      .from("cost_centers")
      .insert({
        tenant_id: tenantId,
        name: "Online",
        slug: "online",
        type: "online" as any,
        is_active: true,
        allows_installments: true,
        max_installments: 2,
        split_platform_percent: splitPlatform,
        split_seller_percent: splitSeller,
      } as any)
      .select("id")
      .single();
    if (ccErr || !cc) {
      throw new Error(`Falha ao criar centro de custo padrão: ${ccErr?.message ?? "?"}`);
    }
    const costCenterId = cc.id as string;

    // 7+8. Gerar QR Code para /i/{slug} e salvar em tenants.cover/qr
    const origin = process.env.PUBLIC_SITE_URL || "https://tk2projeto1.lovable.app";
    const publicUrl = `${origin}/i/${slug}`;
    let qrCodeUrl: string | null = null;
    try {
      qrCodeUrl = await generateQrDataUrl(publicUrl);
      // Reaproveita cover_photo_url somente se branding não veio — caso contrário,
      // armazena o QR no próprio centro de custo "Online" (qr_code_url existe lá)
      await supabaseAdmin
        .from("cost_centers")
        .update({ qr_code_url: qrCodeUrl })
        .eq("id", costCenterId);
    } catch (e) {
      // QR não é bloqueante — segue o onboarding
      console.warn("[onboarding] falha ao gerar QR:", e);
    }

    // 9+10. Criar administrador e enviar convite (opcional)
    if (data.admin) {
      const { data: invited, error: invErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.admin.email,
        {
          data: {
            full_name: data.admin.full_name ?? "",
            phone: data.admin.phone ?? "",
            tenant_id: tenantId,
            is_tenant_founder: true,
            lgpd_consent: true,
          },
          redirectTo: `${origin}/login?confirmed=1`,
        },
      );
      if (invErr) {
        console.warn("[onboarding] falha ao convidar admin:", invErr);
      } else if (invited?.user?.id) {
        // Trigger handle_new_user já cria profile + role admin pelo metadata.
        // Garantia adicional caso o trigger não rode (ex.: usuário já existia).
        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: invited.user.id, tenant_id: tenantId, role: "admin" as any },
            { onConflict: "user_id,tenant_id,role" },
          );
      }
    }

    // 11. Retorno
    return {
      tenant_id: tenantId,
      slug,
      public_url: publicUrl,
      qr_code_url: qrCodeUrl,
      cost_center_id: costCenterId,
    };
  });
