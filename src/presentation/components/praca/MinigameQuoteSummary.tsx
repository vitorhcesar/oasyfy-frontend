import { formatCurrency } from "@/presentation/pages/AdminTransactionsPage/utils/format-currency";
import { CircleDollarSign, Percent, Trophy, Wallet } from "lucide-react";

interface IMinigameQuoteSummaryProps {
  stakeCents: number;
  potCents: number;
  feeCents: number;
  winnerNetCents: number;
}

export function MinigameQuoteSummary({
  stakeCents,
  potCents,
  feeCents,
  winnerNetCents,
}: IMinigameQuoteSummaryProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-muted/40 to-background">
      <div className="divide-y divide-border/50">
        <QuoteRow
          icon={Wallet}
          label="Você coloca"
          value={formatCurrency(stakeCents)}
        />
        <QuoteRow
          icon={CircleDollarSign}
          label="Total da partida"
          value={formatCurrency(potCents)}
        />
        <QuoteRow
          icon={Percent}
          label="Taxa estimada"
          value={formatCurrency(feeCents)}
        />
      </div>
      <div className="flex items-center gap-3 bg-primary/10 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Trophy size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Se ganhar
          </p>
          <p className="text-xs text-muted-foreground">seu saldo sobe</p>
        </div>
        <p className="text-base font-semibold tabular-nums text-primary">
          +{formatCurrency(winnerNetCents)}
        </p>
      </div>
    </div>
  );
}

function QuoteRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon size={15} />
      </span>
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
