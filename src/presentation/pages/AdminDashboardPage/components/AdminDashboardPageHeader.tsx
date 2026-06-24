import { Button } from "@/presentation/components/ui/button";
import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import { useUserContext } from "@/presentation/context/UserContext";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useAdminDashboardPageStore } from "../stores/admin-dashboard-page.store";
import { TAdminDashboardPeriod } from "../types/admin-dashboard-period.type";

export default function AdminDashboardPageHeader() {
  const user = useUserContext();
  const name = user?.name || user?.email || "Admin";

  const {
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
  } = useAdminDashboardPageStore();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Painel Administrativo
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Olá, {name.split(" ")[0]}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
          {(["7d", "30d", "90d"] as TAdminDashboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setCustomFrom(undefined);
                setCustomTo(undefined);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                period === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 text-[11px] gap-1.5 font-medium",
                period === "custom" && "border-primary text-primary",
              )}
            >
              <CalendarIcon size={12} />
              {period === "custom" && customFrom && customTo
                ? `${format(customFrom, "dd/MM", {
                    locale: ptBR,
                  })} - ${format(customTo, "dd/MM", { locale: ptBR })}`
                : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <p className="text-xs font-medium text-foreground mb-2">
              Selecione o período
            </p>
            <Calendar
              mode="range"
              selected={
                customFrom && customTo
                  ? { from: customFrom, to: customTo }
                  : undefined
              }
              onSelect={(range) => {
                if (range?.from) {
                  setCustomFrom(range.from);
                  setCustomTo(range.to);
                  if (range.from && range.to) setPeriod("custom");
                }
              }}
              disabled={(date) => date > new Date()}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
