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
    <header className="mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Painel administrativo
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
          Olá, {name.split(" ")[0]}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Visão geral da plataforma e operações do gateway.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="liquid-glass-control flex items-center gap-0.5 rounded-2xl p-1">
          {(["7d", "30d", "90d"] as TAdminDashboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setCustomFrom(undefined);
                setCustomTo(undefined);
              }}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-semibold uppercase tracking-wide transition-all",
                period === p
                  ? "bg-white text-[#0F0617] shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
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
              ripple={false}
              className={cn(
                "liquid-glass-control h-10 min-h-10 shrink-0 gap-2 rounded-2xl border-white/15 bg-transparent text-sm font-medium hover:bg-white/10",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                period === "custom" && "border-primary/50 text-primary",
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
          <PopoverContent
            className="liquid-glass-control w-auto border-white/15 p-3"
            align="end"
          >
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
