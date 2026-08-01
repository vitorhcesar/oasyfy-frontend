import { cn } from "@/presentation/utils/cn";
import { Loader2, User } from "lucide-react";
import useAdminRevenueRankingQuery from "../hooks/use-admin-revenue-ranking-query";
import { formatCompact } from "../utils/format-compact";

export default function TopSellers() {
  const { data, isLoading } = useAdminRevenueRankingQuery();
  const entries = data.entries;

  return (
    <div className="admin-surface p-5 md:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Ranking de faturamento
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Maior volume no período
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.userId} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  entry.position === 1
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground",
                )}
              >
                {entry.position}
              </span>

              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/60">
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={14} className="text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.fullName || entry.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.transactionCount} tx ·{" "}
                  {formatCompact(entry.revenueAmount)}
                  {entry.accountId ? ` · ${entry.accountId}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatCompact(entry.feeAmount)} tax
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sem dados
        </p>
      )}
    </div>
  );
}
