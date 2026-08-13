import type { TAdminWithdrawalView } from "@/presentation/hooks/use-admin-withdrawals-query";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "../utils/format-currency";
import { statusBadge } from "../utils/status-config";

interface AdminWithdrawalsTableProps {
  withdrawals: TAdminWithdrawalView[];
  loading: boolean;
  currentPage: number;
  perPage: number;
  actionLoading: string | null;
  onPageChange: (page: number) => void;
  onOpenApprovalModal: (withdrawal: TAdminWithdrawalView) => void;
}

export default function AdminWithdrawalsTable({
  withdrawals,
  loading,
  currentPage,
  perPage,
  actionLoading,
  onPageChange,
  onOpenApprovalModal,
}: AdminWithdrawalsTableProps) {
  const totalPages = Math.max(1, Math.ceil(withdrawals.length / perPage));
  const paginatedData = withdrawals.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="admin-surface px-6 py-16 text-center">
        <ArrowLeftRight className="mx-auto mb-3 text-muted-foreground" size={24} />
        <p className="mb-1 text-base font-semibold text-foreground">
          Nenhum saque encontrado
        </p>
        <p className="text-sm text-muted-foreground">
          Os saques aparecerão aqui.
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
              Produtor
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor do Saque
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chave PIX
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((w) => (
            <tr
              key={w.id}
              className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/25"
            >
              <td className="px-5 py-3.5">
                <p className="text-sm font-semibold text-foreground">
                  {w.seller_name || "Seller"}
                </p>
                {w.seller_email && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {w.seller_email}
                  </p>
                )}
              </td>
              <td className="px-5 py-3.5 text-sm font-bold tabular-nums text-foreground">
                {formatCurrency(w.amount)}
              </td>
              <td className="px-5 py-3.5">
                {w.pix_key ? (
                  <span className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 font-mono text-xs text-foreground">
                    {w.pix_key}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5 py-3.5">{statusBadge(w.status)}</td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onOpenApprovalModal(w)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Ver detalhes"
                  >
                    <Eye size={16} />
                  </button>
                  {w.status === "transferring" && (
                    <button
                      onClick={() => onOpenApprovalModal(w)}
                      disabled={actionLoading === w.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-transparent bg-white px-3 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Aprovar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 px-5 py-3">
          <p className="text-sm text-muted-foreground">
            {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, withdrawals.length)} de{" "}
            {withdrawals.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                    currentPage === page
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
