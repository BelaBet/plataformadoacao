import { createFileRoute } from "@tanstack/react-router";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  Barcode,
  CreditCard,
  MoreHorizontal,
  Copy,
  Upload,
  Check,
  Smartphone,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
  head: () => ({ meta: [{ title: "Pagamentos" }] }),
});

type ActionKey = "pix" | "boleto" | "fatura" | "mais";

type Action = {
  key: ActionKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  tint: string; // tailwind classes for circle bg + icon color
};

const actions: Action[] = [
  { key: "pix",    label: "Pix",                     icon: QrCode,          tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  { key: "boleto", label: "Pagamento",               icon: Barcode,         tint: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  { key: "fatura", label: "Pagar fatura",            icon: CreditCard,      tint: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  { key: "mais",   label: "Mais opções",             icon: MoreHorizontal,  tint: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
];

function PaymentsPage() {
  const [open, setOpen] = useState<ActionKey | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Ações rápidas para o dia a dia.</p>
      </div>

      <section
        aria-label="Ações rápidas de pagamento"
        className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
      >
        <div className="grid grid-cols-4 gap-3 sm:gap-6">
          {actions.map((a) => (
            <QuickAction key={a.key} action={a} onClick={() => setOpen(a.key)} />
          ))}
        </div>
      </section>

      <PixDialog open={open === "pix"} onOpenChange={(v) => !v && setOpen(null)} />
      <BoletoDialog open={open === "boleto"} onOpenChange={(v) => !v && setOpen(null)} />
      <FaturaDialog open={open === "fatura"} onOpenChange={(v) => !v && setOpen(null)} />
      <MaisDialog open={open === "mais"} onOpenChange={(v) => !v && setOpen(null)} onPick={(k) => setOpen(k)} />
    </div>
  );
}

function QuickAction({ action, onClick }: { action: Action; onClick: () => void }) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-xl p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-sm transition-all duration-200",
          "group-hover:scale-105 group-hover:shadow-md group-active:scale-95 sm:h-24 sm:w-24",
          action.tint,
        )}
      >
        <Icon className="!h-7 !w-7 sm:!h-8 sm:!w-8" />
      </span>
      <span className="text-xs font-medium text-foreground/90 sm:text-sm">{action.label}</span>
    </button>
  );
}

/* ---------- Modal shell ---------- */

function PaymentDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl p-6 backdrop-blur-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-2 space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- PIX ---------- */

function PixDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [key, setKey] = useState("");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!key) return toast.error("Informe a chave Pix primeiro");
    await navigator.clipboard.writeText(key);
    setCopied(true);
    toast.success("Chave copiada");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <PaymentDialog open={open} onOpenChange={onOpenChange} title="Transferência Pix" description="Envie em segundos para qualquer chave.">
      <div className="space-y-2">
        <Label htmlFor="pix-key">Chave Pix</Label>
        <div className="flex gap-2">
          <Input
            id="pix-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="CPF, e-mail, telefone ou aleatória"
            inputMode="text"
          />
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copiar chave">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pix-amount">Valor</Label>
        <Input id="pix-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" />
      </div>
      <Button className="w-full" size="lg" onClick={() => toast.success("Pagamento em processamento")}>
        Continuar
      </Button>
    </PaymentDialog>
  );
}

/* ---------- BOLETO ---------- */

function BoletoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <PaymentDialog open={open} onOpenChange={onOpenChange} title="Pagamento de boleto" description="Digite o código ou envie o arquivo.">
      <div className="space-y-2">
        <Label htmlFor="boleto-code">Código de barras</Label>
        <Input
          id="boleto-code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/40 p-4 text-sm transition-colors hover:bg-muted">
        <span className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">{fileName ?? "Enviar arquivo do boleto (PDF/JPG)"}</span>
        </span>
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <div className="space-y-2">
        <Label htmlFor="boleto-amount">Valor</Label>
        <Input id="boleto-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" />
      </div>

      <Button className="w-full" size="lg" onClick={() => toast.success("Boleto enviado para pagamento")}>
        Pagar
      </Button>
    </PaymentDialog>
  );
}

/* ---------- FATURA ---------- */

function FaturaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [method, setMethod] = useState<"total" | "minimo" | "outro">("total");
  const [custom, setCustom] = useState("");

  return (
    <PaymentDialog open={open} onOpenChange={onOpenChange} title="Fatura do cartão" description="Escolha como deseja pagar.">
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">Total da fatura</p>
        <p className="font-display text-2xl">R$ 1.284,90</p>
        <p className="mt-1 text-xs text-muted-foreground">Vencimento em 25/05</p>
      </div>

      <div className="grid gap-2">
        {[
          { id: "total" as const, label: "Pagar valor total", hint: "R$ 1.284,90" },
          { id: "minimo" as const, label: "Pagamento mínimo", hint: "R$ 192,73" },
          { id: "outro" as const, label: "Outro valor", hint: "Você escolhe" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMethod(opt.id)}
            className={cn(
              "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
              method === opt.id ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            )}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            <span className="text-xs text-muted-foreground">{opt.hint}</span>
          </button>
        ))}
      </div>

      {method === "outro" && (
        <Input inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="R$ 0,00" />
      )}

      <Button className="w-full" size="lg" onClick={() => toast.success("Pagamento confirmado")}>
        Confirmar pagamento
      </Button>
    </PaymentDialog>
  );
}

/* ---------- MAIS ---------- */

function MaisDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (k: ActionKey) => void;
}) {
  const items: { icon: ComponentType<{ className?: string }>; label: string; onClick: () => void }[] = [
    { icon: Smartphone,     label: "Recarga de celular",   onClick: () => toast.info("Em breve") },
    { icon: Receipt,        label: "Contas e impostos",    onClick: () => onPick("boleto") },
    { icon: ArrowLeftRight, label: "Transferência entre contas", onClick: () => toast.info("Em breve") },
    { icon: PiggyBank,      label: "Investir",             onClick: () => toast.info("Em breve") },
  ];

  return (
    <PaymentDialog open={open} onOpenChange={onOpenChange} title="Mais opções" description="Outras ações disponíveis.">
      <ul className="divide-y rounded-xl border">
        {items.map(({ icon: Icon, label, onClick }) => (
          <li key={label}>
            <button
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground/80">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </PaymentDialog>
  );
}
