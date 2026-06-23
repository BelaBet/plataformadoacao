import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { brl } from "./format";
import type { BalanceResponse } from "@/lib/recipient.functions";

type Props = {
  balance?: BalanceResponse;
  loading?: boolean;
  onTransfer?: () => void;
};

export function BalanceCards({ balance, loading, onTransfer }: Props) {
  const waiting = balance?.waiting_funds?.amount ?? 0;

  return (
    <Card>
      <CardContent className="p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-4 w-4" /> Saldo disponível
          </div>
          <div className="mt-1 font-display text-4xl leading-none">
            {loading ? <Skeleton className="h-10 w-44" /> : brl(balance?.available?.amount)}
          </div>
          {!loading && waiting > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-700">
              <Clock className="h-3.5 w-3.5" /> {brl(waiting)} aguardando confirmação
            </p>
          )}
          {onTransfer && (
            <Button size="sm" className="mt-4" onClick={onTransfer}>
              Transferir <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-8 text-right">
          <div>
            <div className="flex items-center justify-end gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> A receber
            </div>
            <div className="mt-1 font-display text-xl">
              {loading ? <Skeleton className="h-6 w-24" /> : brl(balance?.waiting_funds?.amount)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-end gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" /> Transferido
            </div>
            <div className="mt-1 font-display text-xl">
              {loading ? <Skeleton className="h-6 w-24" /> : brl(balance?.transferred?.amount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
