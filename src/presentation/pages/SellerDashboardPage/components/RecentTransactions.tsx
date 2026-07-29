import { Transaction } from "@/domain/entities/transaction.entity";
import { Button } from "@/presentation/components/ui/button";
import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { cn } from "@/presentation/utils/cn";
import { ArrowDownLeft, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/format-currency";

function formatDateTime(date: string) {
  const d = new Date(date);
  return `${d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })}, ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getMethodLabel(method: string) {
  switch (method) {
    case "pix":
      return "Pix";
    case "card":
      return "Cartão";
    case "boleto":
      return "Boleto";
    case "crypto":
      return "Crypto";
    case "withdrawal":
      return "Saque";
    default:
      return method;
  }
}

function getMethodAccent(method: string) {
  switch (method) {
    case "pix":
      return "bg-primary/10 text-primary";
    case "card":
      return "bg-primary/10 text-primary";
    case "boleto":
      return "bg-warning/10 text-warning";
    case "crypto":
      return "bg-success/10 text-success";
    default:
      return "bg-primary/10 text-primary";
  }
}

interface IRecentTransactionsProps {
  transactions: Transaction[];
  loading: boolean;
}

export default function RecentTransactions({
  transactions,
  loading,
}: IRecentTransactionsProps) {
  const navigate = useNavigate();
  const { hideBalance } = useHideBalance();

  const recentTransactions = useMemo(
    () => transactions.filter((t) => t.amount > 0).slice(0, 5),
    [transactions],
  );

  return (
    <div className="admin-surface p-5 md:p-6">
      <h3 className="mb-5 text-base font-semibold text-foreground">
        Últimas transações
      </h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : recentTransactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma transação encontrada.
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    getMethodAccent(tx.method),
                  )}
                >
                  <ArrowDownLeft size={16} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getMethodLabel(tx.method)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(tx.createdAt.toISOString())}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums text-foreground transition-all",
                  hideBalance && "blur-md select-none",
                )}
              >
                {formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {recentTransactions.length > 0 && (
        <Button
          variant="outline"
          ripple={false}
          onClick={() => navigate("/seller/transactions")}
          className="mt-4 h-10 w-full rounded-2xl border-primary/20 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/15 hover:text-primary"
        >
          Ver todas as transações
        </Button>
      )}
    </div>
  );
}
