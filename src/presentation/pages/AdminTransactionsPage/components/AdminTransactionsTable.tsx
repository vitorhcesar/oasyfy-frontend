import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Lock,
} from "lucide-react";
import { formatCurrency } from "../utils/format-currency";
import { statusConfig } from "../utils/status-config";
import type { Transaction } from "../types/admin-transaction.type";

interface IAdminTransactionsTableProps {
  loading: boolean;
  displayFiltered: Transaction[];
  paginatedData: Transaction[];
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onOpenDetail: (tx: Transaction) => void;
}

export default function AdminTransactionsTable({
  loading,
  displayFiltered,
  paginatedData,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onOpenDetail,
}: IAdminTransactionsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (displayFiltered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-12 text-center">
        <CreditCard
          className="text-muted-foreground/30 mx-auto mb-3"
          size={20}
        />
        <p className="text-sm font-medium text-foreground mb-0.5">
          Nenhuma transação
        </p>
        <p className="text-xs text-muted-foreground">
          As transações aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b border-border/30 bg-muted/20">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
              Cliente
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
              Valor
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
              Método
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">
              Data
            </th>
            <th className="text-center px-3 py-2 font-medium text-muted-foreground text-[10px] uppercase tracking-wider w-16"></th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((tx) => (
            <tr
              key={tx.id}
              className="border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors cursor-pointer"
              onClick={() => onOpenDetail(tx)}
            >
              <td className="px-3 py-2">
                <p className="font-medium text-foreground text-xs">
                  {tx.customer_name || "Cliente padrão"}
                </p>
                {tx.customer_email && (
                  <p className="text-[10px] text-muted-foreground/50 truncate max-w-[160px]">
                    {tx.customer_email}
                  </p>
                )}
              </td>
              <td className="px-3 py-2 font-semibold text-foreground text-xs">
                {formatCurrency(tx.amount)}
              </td>
              <td className="px-3 py-2">
                <span className="text-[10px] uppercase font-medium text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                  {tx.method}
                </span>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  {(() => {
                    const s = statusConfig[tx.status] || {
                      label: tx.status,
                      dot: "bg-muted-foreground/40",
                    };
                    return (
                      <span className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
                        />
                        <span className="text-[11px] font-medium text-foreground">
                          {s.label}
                        </span>
                      </span>
                    );
                  })()}
                  {tx.is_locked && (
                    <Lock size={10} className="text-destructive" />
                  )}
                  {tx.is_fake_refund && (
                    <Eye size={10} className="text-orange-500" />
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground text-[11px]">
                {format(new Date(tx.created_at), "dd/MM/yy HH:mm", {
                  locale: ptBR,
                })}
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(tx);
                  }}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/20 bg-muted/10">
          <p className="text-[10px] text-muted-foreground">
            {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, displayFiltered.length)} de{" "}
            {displayFiltered.length}
          </p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={12} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= totalPages - 2)
                page = totalPages - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "w-6 h-6 rounded text-[10px] font-medium transition-all",
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/30",
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
