import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "./format";
import type { TransactionsSummary } from "@/lib/recipient.functions";

type Props = {
  summary?: TransactionsSummary;
  loading?: boolean;
};

export function ExtractSummaryCards({ summary, loading }: Props) {
  const items: {
    label: string;
    value: number | undefined;
    sign: "+" | "−" | "";
    tone: string;
    isCount?: boolean;
  }[] = [
    {
      label: "Total de entradas",
      value: summary?.totalGrossCents,
      sign: "+",
      tone: "text-emerald-700",
    },
    {
      label: "Taxa administrativa",
      value: summary?.totalFeeCents,
      sign: "−",
      tone: "text-amber-700",
    },
    { label: "Total líquido", value: summary?.totalNetCents, sign: "", tone: "" },
    { label: "Doações no período", value: summary?.count, sign: "", tone: "", isCount: true },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-muted/60 p-4">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className={`mt-1.5 font-display text-lg ${item.tone}`}>
            {loading || item.value === undefined ? (
              <Skeleton className="h-6 w-20" />
            ) : item.isCount ? (
              item.value
            ) : (
              `${item.sign ? `${item.sign} ` : ""}${brl(item.value)}`
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
