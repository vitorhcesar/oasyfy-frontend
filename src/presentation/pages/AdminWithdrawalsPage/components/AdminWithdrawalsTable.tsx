import type { TAdminWithdrawalView } from "@/presentation/hooks/use-admin-withdrawals-query";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
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
      <div className="flex justify-center py-24">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
          <ArrowLeftRight className="text-muted-foreground/40" size={24} />
        </div>
        <p className="text-foreground font-semibold mb-1">
          Nenhum saque encontrado
        </p>
        <p className="text-sm text-muted-foreground">
          Os saques aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-border/50 bg-card overflow-hidden animate-fade-in overflow-x-auto"
      style={{ animationDelay: "150ms" }}
    >
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-border/40">
            <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
              Produtor
            </th>
            <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
              Valor do Saque
            </th>
            <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
              Chave PIX
            </th>
            <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
              Status
            </th>
            <th className="text-right px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((w, i) => (
            <tr
              key={w.id}
              className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <td className="px-5 py-3.5">
                <p className="font-medium text-foreground text-[13px]">
                  {w.seller_name || "Seller"}
                </p>
                {w.seller_email && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {w.seller_email}
                  </p>
                )}
              </td>
              <td className="px-5 py-3.5 font-bold text-foreground text-[13px]">
                {formatCurrency(w.amount)}
              </td>
              <td className="px-5 py-3.5">
                {w.pix_key ? (
                  <span className="text-xs font-mono text-foreground bg-muted/30 px-2 py-1 rounded">
                    {w.pix_key}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">—</span>
                )}
              </td>
              <td className="px-5 py-3.5">{statusBadge(w.status)}</td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onOpenApprovalModal(w)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={14} />
                  </button>
                  {w.status === "transferring" && (
                    <button
                      onClick={() => onOpenApprovalModal(w)}
                      disabled={actionLoading === w.id}
                      className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={10} className="inline mr-1" />
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
          <p className="text-xs md:text-sm text-muted-foreground/60">
            {(currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, withdrawals.length)} de{" "}
            {withdrawals.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} />
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
                    "w-7 h-7 rounded-lg text-xs md:text-sm font-medium transition-all",
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
