import ListPagination from "@/presentation/components/ListPagination";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Eye, Lock } from "lucide-react";
import type { Transaction } from "../types/admin-transaction.type";
import { formatCurrency } from "../utils/format-currency";
import { statusConfig } from "../utils/status-config";
import { hasSaleSplitMetadata } from "../utils/transaction-split";

interface IAdminTransactionsTableProps {
  loading: boolean;
  rows: Transaction[];
  total: number;
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onOpenDetail: (tx: Transaction) => void;
}

export default function AdminTransactionsTable({
  loading,
  rows,
  total,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onOpenDetail,
}: IAdminTransactionsTableProps) {
  if (loading) {
    return null;
  }

  if (total === 0) {
    return (
      <div className="admin-surface px-6 py-16 text-center">
        <CreditCard className="mx-auto mb-3 text-muted-foreground" size={24} />
        <p className="mb-1 text-base font-semibold text-foreground">
          Nenhuma transação
        </p>
        <p className="text-sm text-muted-foreground">
          As transações aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-surface overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cliente
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Método
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data
            </th>
            <th className="w-20 px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground" />
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => {
            const s = statusConfig[tx.status] || {
              label: tx.status,
              cls: "border-border bg-muted text-muted-foreground",
              dot: "bg-muted-foreground",
            };

            return (
              <tr
                key={tx.id}
                className="cursor-pointer border-b border-border/40 last:border-0 transition-colors hover:bg-muted/25"
                onClick={() => onOpenDetail(tx)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {tx.customer_name || "Cliente padrão"}
                    </p>
                    {hasSaleSplitMetadata(tx.metadata) && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Split
                      </span>
                    )}
                  </div>
                  {tx.customer_email && (
                    <p className="mt-0.5 max-w-[180px] truncate text-sm text-muted-foreground">
                      {tx.customer_email}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold uppercase text-foreground">
                    {tx.method}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.cls}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    {tx.is_locked && (
                      <Lock size={14} className="text-destructive" />
                    )}
                    {tx.is_fake_refund && (
                      <Eye size={14} className="text-warning" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {format(new Date(tx.created_at), "dd/MM/yy HH:mm", {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(tx);
                    }}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ListPagination
        page={currentPage}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPageChange={onPageChange}
        variant="table"
      />
    </div>
  );
}
