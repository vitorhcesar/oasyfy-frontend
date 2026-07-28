import {
  IPlatformMetricsTransactionDto,
  ISellerProfileSummaryDto,
} from "@/infra/http/services/api/modules/types/admin-platform-metrics.types";
import { cn } from "@/presentation/utils/cn";
import { useMemo } from "react";
import { formatCompact } from "../utils/format-compact";

interface ITopSellersProps {
  completedTransactions: IPlatformMetricsTransactionDto[];
  sellerProfiles: ISellerProfileSummaryDto[];
}

export default function TopSellers({
  completedTransactions,
  sellerProfiles,
}: ITopSellersProps) {
  const topSellers = useMemo(() => {
    const map: Record<
      string,
      { sellerId: string; volume: number; count: number; fees: number }
    > = {};
    completedTransactions.forEach((tx) => {
      if (tx.sellerId == null) return;
      const sellerKey = String(tx.sellerId);
      if (!map[sellerKey])
        map[sellerKey] = {
          sellerId: sellerKey,
          volume: 0,
          count: 0,
          fees: 0,
        };
      map[sellerKey].volume += tx.amount;
      map[sellerKey].count += 1;
      map[sellerKey].fees += tx.feeAmount;
    });
    return Object.values(map)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [completedTransactions]);

  const getSellerName = (sellerId: string) => {
    const p = sellerProfiles.find((s) => String(s.userId) === sellerId);
    return p?.fullName || sellerId.slice(0, 8);
  };

  return (
    <div className="admin-surface p-5 md:p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Top Sellers
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Maior volume no período
      </p>

      {topSellers.length > 0 ? (
        <div className="space-y-3">
          {topSellers.map((s, i) => (
            <div key={s.sellerId} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i === 0
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {getSellerName(s.sellerId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.count} tx · {formatCompact(s.volume)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatCompact(s.fees)} tax
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
