import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { translateError } from "@/lib/translate-error";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manage/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Painel — Configurações" }] }),
});

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  pix_key: string | null;
};

function SettingsPage() {
  const { profile, refresh } = useAuth();
  const [row, setRow] = useState<TenantRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.tenant_id) return;
    supabase.from("tenants")
      .select("id, name, slug, tagline, logo_url, cover_photo_url, primary_color, accent_color, pix_key")
      .eq("id", profile.tenant_id)
      .maybeSingle()
      .then(({ data }) => data && setRow(data as TenantRow));
  }, [profile?.tenant_id]);

  if (!row) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </Card>
    );
  }

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      name: row.name,
      tagline: row.tagline,
      logo_url: row.logo_url,
      cover_photo_url: row.cover_photo_url,
      primary_color: row.primary_color,
      accent_color: row.accent_color,
      pix_key: row.pix_key,
    }).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(translateError(error));
    toast.success("Configurações salvas");
    refresh();
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">Identidade visual e dados da igreja.</p>
      </div>

      <Card className="space-y-5 p-6">
        <h2 className="font-medium">Identificação</h2>
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Slug</Label>
          <Input value={row.slug} disabled />
          <p className="text-xs text-muted-foreground">O slug não pode ser alterado.</p>
        </div>
        <div className="grid gap-2">
          <Label>Frase de apresentação</Label>
          <Textarea
            value={row.tagline ?? ""}
            onChange={(e) => setRow({ ...row, tagline: e.target.value || null })}
            rows={2}
          />
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="font-medium">Marca</h2>
        <div className="grid gap-2">
          <Label>URL do logo</Label>
          <Input
            value={row.logo_url ?? ""}
            onChange={(e) => setRow({ ...row, logo_url: e.target.value || null })}
            placeholder="https://..."
          />
        </div>
        <div className="grid gap-2">
          <Label>URL da capa</Label>
          <Input
            value={row.cover_photo_url ?? ""}
            onChange={(e) => setRow({ ...row, cover_photo_url: e.target.value || null })}
            placeholder="https://..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Cor primária</Label>
            <Input
              type="color"
              value={row.primary_color ?? "#1a1a1a"}
              onChange={(e) => setRow({ ...row, primary_color: e.target.value })}
              className="h-10 w-20"
            />
          </div>
          <div className="grid gap-2">
            <Label>Cor de destaque</Label>
            <Input
              type="color"
              value={row.accent_color ?? "#C9993A"}
              onChange={(e) => setRow({ ...row, accent_color: e.target.value })}
              className="h-10 w-20"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="font-medium">Pagamentos</h2>
        <div className="grid gap-2">
          <Label>Chave PIX</Label>
          <Input
            value={row.pix_key ?? ""}
            onChange={(e) => setRow({ ...row, pix_key: e.target.value || null })}
            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
