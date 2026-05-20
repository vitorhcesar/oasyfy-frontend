import { Transaction } from "@/domain/entities/transaction.entity";
import { useHideBalance } from "@/http/hooks/use-hide-balance";
import { cn } from "@/http/utils/cn";
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

function getMethodColor(method: string) {
  switch (method) {
    case "pix":
      return "text-primary";
    case "card":
      return "text-blue-500";
    case "boleto":
      return "text-amber-500";
    case "crypto":
      return "text-purple-500";
    default:
      return "text-primary";
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
    [transactions]
  );

  return (
    <div className="rounded-xl bg-card border border-border/40 p-4">
      <h3 className="text-xs font-semibold text-foreground mb-3">
        Últimas transações
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      ) : recentTransactions.length === 0 ? (
        <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
          Nenhuma transação encontrada.
        </p>
      ) : (
        <div className="divide-y divide-border/30">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center",
                    getMethodColor(tx.method)
                  )}
                >
                  <ArrowDownLeft size={12} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-foreground">
                    {getMethodLabel(tx.method)}
                  </p>
                  <p className="text-[11px] md:text-xs text-muted-foreground">
                    {formatDateTime(tx.createdAt.toISOString())}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold text-foreground transition-all",
                  hideBalance && "blur-md select-none"
                )}
              >
                {formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {recentTransactions.length > 0 && (
        <button
          onClick={() => navigate("/seller/transactions")}
          className="w-full mt-3 py-2 rounded-lg bg-primary/10 text-primary text-xs md:text-sm font-medium hover:bg-primary/15 transition-colors"
        >
          Ver todas as transações
        </button>
      )}
    </div>
  );
}
