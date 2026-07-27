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
    <header className="mb-6 flex animate-fade-in flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Painel administrativo
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Olá, {name.split(" ")[0]}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
          {(["7d", "30d", "90d"] as TAdminDashboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setCustomFrom(undefined);
                setCustomTo(undefined);
              }}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold uppercase transition-all",
                period === p
                  ? "bg-primary/15 text-primary shadow-sm"
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
                "h-10 gap-2 rounded-xl text-sm font-medium",
                period === "custom" && "border-primary text-primary",
              )}
            >
              <CalendarIcon size={15} />
              {period === "custom" && customFrom && customTo
                ? `${format(customFrom, "dd/MM", {
                    locale: ptBR,
                  })} - ${format(customTo, "dd/MM", { locale: ptBR })}`
                : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <p className="mb-2 text-sm font-medium text-foreground">
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
