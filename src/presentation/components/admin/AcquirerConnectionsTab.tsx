import { AcquirerConnectionCard } from "@/presentation/components/admin/AcquirerConnectionCard";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/presentation/components/ui/collapsible";
import type { TAcquirerConnectionView } from "@/presentation/hooks/use-admin-acquirer-connections-query";
import {
  ACQUIRER_CONNECTION_GROUPS,
  collectAcquirerMethods,
  filterAcquirerConnections,
  getAcquirerMethodLabel,
  groupAcquirerConnections,
} from "@/presentation/utils/acquirer-connection-catalog.util";
import { ChevronDown, Link2, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

interface IAcquirerConnectionsTabProps {
  connections: TAcquirerConnectionView[];
  loading: boolean;
  bootstrapping: boolean;
  onEnsureDefaults: () => void;
  onToggleActive: (connection: TAcquirerConnectionView) => void;
}

export function AcquirerConnectionsTab({
  connections,
  loading,
  bootstrapping,
  onEnsureDefaults,
  onToggleActive,
}: IAcquirerConnectionsTabProps) {
  const [nameQuery, setNameQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const availableMethods = useMemo(
    () => collectAcquirerMethods(connections),
    [connections],
  );

  const filteredConnections = useMemo(
    () => filterAcquirerConnections(connections, nameQuery, methodFilter),
    [connections, nameQuery, methodFilter],
  );

  const groupedConnections = useMemo(
    () => groupAcquirerConnections(filteredConnections),
    [filteredConnections],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="admin-surface space-y-4 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Link2 size={22} className="text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            Nenhuma adquirente cadastrada
          </p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Carregue Woovi, OnlyUp e Bass Pago para habilitar o botão{" "}
            <strong>Configurar</strong> e definir credenciais + roteamento PIX.
          </p>
        </div>
        <button
          type="button"
          onClick={onEnsureDefaults}
          disabled={bootstrapping}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {bootstrapping ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Carregar adquirentes padrão
        </button>
      </div>
    );
  }

  const connectionCountLabel =
    filteredConnections.length === 1
      ? "1 conexão"
      : `${filteredConnections.length} conexões`;

  return (
    <div className="space-y-6">
      <div className="admin-surface p-4 md:p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Filtros ({connectionCountLabel})
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="acquirer-connection-name" className="text-xs">
              Nome
            </Label>
            <Input
              id="acquirer-connection-name"
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
              placeholder="Buscar por nome"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Funcionalidades</Label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {getAcquirerMethodLabel(method)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredConnections.length === 0 ? (
        <div className="admin-surface px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma conexão encontrada com esses filtros.
          </p>
        </div>
      ) : (
        ACQUIRER_CONNECTION_GROUPS.map((group) => {
          const items = groupedConnections[group.key];
          if (items.length === 0) {
            return null;
          }

          return (
            <Collapsible key={group.key} defaultOpen>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-xl py-1 text-left">
                <h2 className="text-base font-semibold text-foreground">
                  {group.title} ({items.length})
                </h2>
                <ChevronDown
                  size={16}
                  className="text-muted-foreground transition-transform duration-200 group-data-[state=closed]:-rotate-90"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2">
                  {items.map((connection) => (
                    <AcquirerConnectionCard
                      key={connection.id}
                      connection={connection}
                      onToggleActive={onToggleActive}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })
      )}
    </div>
  );
}
