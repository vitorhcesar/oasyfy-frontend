import { Switch } from "@/presentation/components/ui/switch";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useHideBalance } from "@/presentation/hooks/use-hide-balance";
import { SELLER_PROFILE_QUERY_KEY } from "@/presentation/hooks/use-seller-profile-query";
import { cn } from "@/presentation/utils/cn";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trophy, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import useSellerRevenueRankingQuery, {
  SELLER_REVENUE_RANKING_QUERY_KEY,
} from "../hooks/use-seller-revenue-ranking-query";
import { formatCurrency } from "../utils/format-currency";

export default function RevenueRanking() {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const { hideBalance } = useHideBalance();
  const { data, isLoading } = useSellerRevenueRankingQuery();
  const [toggling, setToggling] = useState(false);

  const showIdentity = data?.me.showIdentityInRevenueRanking ?? false;

  const handleToggleIdentity = async (checked: boolean) => {
    setToggling(true);
    try {
      await apiService.modules.sellerPortal.updateProfile({
        showIdentityInRevenueRanking: checked,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SELLER_PROFILE_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: SELLER_REVENUE_RANKING_QUERY_KEY,
        }),
      ]);
      toast.success(
        checked
          ? "Você agora aparece identificado no ranking"
          : "Você voltou a aparecer como anônimo",
      );
    } catch {
      toast.error("Não foi possível atualizar a preferência");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="admin-surface mb-6 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Ranking de faturamento
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Maior volume no período · por padrão você aparece como anônimo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={showIdentity}
            onCheckedChange={handleToggleIdentity}
            disabled={toggling || isLoading}
            aria-label="Aparecer no ranking com minha identidade"
          />
          <span className="text-xs text-muted-foreground">
            Mostrar minha identidade
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sem dados no período
        </p>
      ) : (
        <div className="space-y-3">
          {data.entries.map((entry) => {
            const label = entry.anonymous
              ? "Anônimo"
              : entry.displayName || "Seller";

            return (
              <div
                key={`${entry.position}-${entry.isCurrentUser ? "me" : "other"}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-1.5",
                  entry.isCurrentUser && "bg-primary/5 ring-1 ring-primary/15",
                )}
              >
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
                  {entry.avatarUrl && !entry.anonymous ? (
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
                    {label}
                    {entry.isCurrentUser && (
                      <span className="ml-1.5 text-xs font-normal text-primary">
                        Você
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.transactionCount} tx
                  </p>
                </div>

                <span className="text-sm font-semibold text-foreground">
                  {hideBalance
                    ? "••••"
                    : formatCurrency(entry.revenueAmount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {data?.me && data.me.position != null && data.me.position > 10 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Sua posição: #{data.me.position} ·{" "}
          {hideBalance ? "••••" : formatCurrency(data.me.revenueAmount)}
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Preferência também em{" "}
        <Link
          to="/seller/settings"
          className="font-medium text-primary hover:underline"
        >
          Configurações → Perfil
        </Link>
      </p>
    </div>
  );
}
