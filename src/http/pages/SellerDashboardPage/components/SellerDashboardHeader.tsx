import { Calendar } from "@/http/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/http/components/ui/popover";
import { useHideBalance } from "@/http/hooks/use-hide-balance";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { cn } from "@/http/utils/cn";
import { ArrowUpRight, CalendarIcon, Eye, EyeOff } from "lucide-react";

interface ISellerDashboardHeaderProps {}

export default function SellerDashboardHeader({}: ISellerDashboardHeaderProps) {
  const { user } = useAuthStore();
  const name = user?.name || user?.email?.split("@")[0] || "Seller";

  const { hideBalance, toggleHideBalance } = useHideBalance();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Olá, {name.split(" ")[0]}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Painel de controle da sua empresa
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleHideBalance}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/50 text-muted-foreground text-xs md:text-sm font-medium hover:text-foreground hover:border-border transition-all"
          title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
        >
          {hideBalance ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
        <button
          onClick={() => setWithdrawalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowUpRight size={12} />
          Solicitar saque
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all",
                timeRange === "custom"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <CalendarIcon size={12} />
              {timeRange === "custom" && dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd/MM", {
                    locale: ptBR,
                  })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                : "Filtrar"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground">
                Selecione o período
              </p>
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from) setTimeRange("custom");
                }}
                disabled={(date) => date > new Date()}
                numberOfMonths={2}
                className="p-2 pointer-events-auto rounded-lg border border-border/40"
                locale={ptBR}
              />
              {dateRange && (
                <button
                  onClick={() => {
                    setDateRange(undefined);
                    setTimeRange("7d");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
