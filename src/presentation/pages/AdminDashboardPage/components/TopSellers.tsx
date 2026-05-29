import {
  IPlatformMetricsTransactionDto,
  ISellerProfileSummaryDto,
} from "@/infra/http/services/api/modules/admin-platform-metrics.types";
import { cn } from "@/presentation/utils/cn";
import { useMemo } from "react";
import { formatCompact } from "../../utils/format-compact";

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
    <div className="rounded-xl bg-card border border-border/50 p-3">
      <h3 className="text-xs font-semibold text-foreground mb-2">
        Top Sellers
      </h3>

      {topSellers.length > 0 ? (
        <div className="space-y-2">
          {topSellers.map((s, i) => (
            <div key={s.sellerId} className="flex items-center gap-2">
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0",
                  i === 0
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">
                  {getSellerName(s.sellerId)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {s.count} tx · {formatCompact(s.volume)}
                </p>
              </div>
              <span className="text-[9px] text-muted-foreground">
                {formatCompact(s.fees)} tax
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-6">
          Sem dados
        </p>
      )}
    </div>
  );
}
