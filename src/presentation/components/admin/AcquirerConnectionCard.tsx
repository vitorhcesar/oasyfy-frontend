import { AcquirerBrandLogo } from "@/presentation/components/admin/AcquirerBrandLogo";
import { Switch } from "@/presentation/components/ui/switch";
import type { TAcquirerConnectionView } from "@/presentation/hooks/use-admin-acquirer-connections-query";
import { cn } from "@/presentation/utils/cn";
import {
  getAcquirerConfigPath,
  inferPixAcquirerProvider,
} from "@/presentation/utils/pix-acquirer-provider";
import { Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

interface IAcquirerConnectionCardProps {
  connection: TAcquirerConnectionView;
  onToggleActive: (connection: TAcquirerConnectionView) => void;
}

export function AcquirerConnectionCard({
  connection,
  onToggleActive,
}: IAcquirerConnectionCardProps) {
  return (
    <div className="admin-surface flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
          <AcquirerBrandLogo
            connection={connection}
            imageClassName="h-14 w-14 object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              {connection.name}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
                connection.status === "connected" &&
                  "border-success/25 bg-success/10 text-success",
                connection.status === "error" &&
                  "border-destructive/25 bg-destructive/10 text-destructive",
                connection.status !== "connected" &&
                  connection.status !== "error" &&
                  "border-border bg-muted text-muted-foreground",
              )}
            >
              {connection.status === "connected"
                ? "Conectada"
                : connection.status === "error"
                  ? "Erro"
                  : "Desconectada"}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {connection.description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {connection.methods.map((method) => (
          <span
            key={method}
            className="rounded-lg border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold uppercase text-foreground"
          >
            {method}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={connection.is_active}
            onCheckedChange={() => onToggleActive(connection)}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {connection.is_active ? "Ativa" : "Inativa"}
          </span>
        </div>
        <Link
          to={getAcquirerConfigPath(inferPixAcquirerProvider(connection))}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
        >
          <Settings2 size={15} />
          Configurar
        </Link>
      </div>
    </div>
  );
}
