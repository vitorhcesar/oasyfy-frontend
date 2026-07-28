import { AcquirerGuideTab } from "@/presentation/components/admin/AcquirerGuideTab";
import { AcquirerBrandLogo, getAcquirerLogoSrc } from "@/presentation/components/admin/AcquirerBrandLogo";
import { AcquirerConfigDialog } from "@/presentation/components/admin/AcquirerConfigDialog";
import type { IAcquirerCredentialsForm } from "@/presentation/utils/acquirer-connection-config.util";
import useAdminAcquirerConnectionsQuery, {
  type TAcquirerConnectionView,
} from "@/presentation/hooks/use-admin-acquirer-connections-query";
import useAdminAcquirerCostsQuery, {
  type TAcquirerCostView,
} from "@/presentation/hooks/use-admin-acquirer-costs-query";
import useAdminRoutingRulesQuery, {
  type TRoutingRuleView,
} from "@/presentation/hooks/use-admin-routing-rules-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { Switch } from "@/presentation/components/ui/switch";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowRightLeft,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const tabs = [
  {
    key: "roteamento-deposito",
    label: "Roteamento inteligente (Depósito)",
    icon: ArrowRightLeft,
  },
  {
    key: "roteamento-saque",
    label: "Roteamento inteligente (Saque)",
    icon: Wallet,
  },
  { key: "conexoes", label: "Conexões", icon: Link2 },
  { key: "guia", label: "Guia", icon: BookOpen },
  { key: "regras-custos", label: "Regras de custos", icon: Calculator },
] as const;

type TTabKey = (typeof tabs)[number]["key"];

const METHODS_DEPOSIT = ["pix", "card", "boleto", "crypto"] as const;
const METHODS_WITHDRAWAL = ["pix", "ted", "crypto"] as const;

interface IRoutingRule extends TRoutingRuleView {}

interface IAcquirerConnection extends TAcquirerConnectionView {}

interface IAcquirerCost extends TAcquirerCostView {}

export default function AdminAcquirer() {
  const apiService = useApiService();
  const {
    data: connections,
    isLoading: loading,
    isError: connectionsError,
    invalidateQuery: invalidateConnections,
  } = useAdminAcquirerConnectionsQuery();
  const {
    data: routingRules,
    isLoading: loadingRouting,
    invalidateQuery: invalidateRoutingRules,
  } = useAdminRoutingRulesQuery();
  const {
    data: costsFromQuery,
    isLoading: loadingCosts,
    invalidateQuery: invalidateCosts,
  } = useAdminAcquirerCostsQuery();
  const [activeTab, setActiveTab] = useState<TTabKey>("conexoes");
  const [configModal, setConfigModal] = useState<IAcquirerConnection | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const [costs, setCosts] = useState<IAcquirerCost[]>([]);
  const [savingCosts, setSavingCosts] = useState(false);
  const [expandedCostAcquirer, setExpandedCostAcquirer] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (connectionsError) {
      toast.error("Erro ao carregar adquirentes");
    }
  }, [connectionsError]);

  useEffect(() => {
    setCosts(costsFromQuery);
  }, [costsFromQuery]);

  const activeConnections = connections.filter(
    (c) => c.is_active && c.status === "connected",
  );

  const openConfig = (conn: IAcquirerConnection) => {
    setConfigModal(conn);
  };

  const saveConfig = async (
    connectionId: number,
    payload: IAcquirerCredentialsForm & {
      status: string;
      isActive: boolean;
    },
  ) => {
    setSaving(true);

    try {
      await apiService.modules.adminConfig.updateAcquirerConnection(
        connectionId,
        {
          apiUrl: payload.apiUrl,
          clientId: payload.clientId,
          accessToken: payload.accessToken,
          hmacKey: payload.hmacKey,
          branchId: payload.branchId,
          accountNumber: payload.accountNumber,
          status: payload.status,
          isActive: payload.isActive,
        },
      );
      toast.success("Credenciais salvas com sucesso!");
      setConfigModal(null);
      await invalidateConnections();
    } catch (error) {
      toast.error("Erro ao salvar credenciais");
      console.error(error);
    }
    setSaving(false);
  };

  const ensureDefaultConnections = async () => {
    setBootstrapping(true);
    try {
      await apiService.modules.adminConfig.ensureDefaultAcquirerConnections();
      toast.success("Adquirentes Woovi e Cartwave carregadas.");
      await invalidateConnections();
    } catch (error) {
      toast.error("Erro ao carregar adquirentes padrão");
      console.error(error);
    }
    setBootstrapping(false);
  };

  const toggleActive = async (conn: IAcquirerConnection) => {
    if (conn.status !== "connected") {
      toast.error("Configure as credenciais antes de ativar.");
      return;
    }
    const next = !conn.is_active;

    try {
      await apiService.modules.adminConfig.setAcquirerConnectionActive(
        Number(conn.id),
        next,
      );
      toast.success(next ? `${conn.name} ativada` : `${conn.name} desativada`);
      await invalidateConnections();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  const renderConnections = () => (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-base font-semibold text-foreground">
          Adquirentes conectadas
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gerencie as conexões com provedores de pagamento.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : connections.length === 0 ? (
        <div className="admin-surface space-y-4 px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Link2 size={22} className="text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              Nenhuma adquirente cadastrada
            </p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Carregue Woovi e Cartwave para habilitar o botão{" "}
              <strong>Configurar</strong> e definir credenciais + roteamento PIX.
            </p>
          </div>
          <button
            type="button"
            onClick={ensureDefaultConnections}
            disabled={bootstrapping}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {bootstrapping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Carregar adquirentes padrão
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="admin-surface flex items-center gap-4 p-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background">
                <AcquirerBrandLogo connection={conn} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {conn.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
                      conn.status === "connected" &&
                        "border-success/25 bg-success/10 text-success",
                      conn.status === "error" &&
                        "border-destructive/25 bg-destructive/10 text-destructive",
                      conn.status !== "connected" &&
                        conn.status !== "error" &&
                        "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {conn.status === "connected"
                      ? "Conectada"
                      : conn.status === "error"
                        ? "Erro"
                        : "Desconectada"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {conn.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {conn.methods.map((m) => (
                    <span
                      key={m}
                      className="rounded-lg border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold uppercase text-foreground"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={conn.is_active}
                  onCheckedChange={() => toggleActive(conn)}
                  className="scale-90"
                />
                <button
                  type="button"
                  onClick={() => openConfig(conn)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <Settings2 size={14} />
                  Configurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AcquirerConfigDialog
        connection={configModal}
        open={!!configModal}
        saving={saving}
        onOpenChange={(open) => {
          if (!open) {
            setConfigModal(null);
          }
        }}
        onSave={saveConfig}
      />
    </div>
  );

  // --- Routing helpers ---
  const getRulesForMethod = (method: string) =>
    routingRules
      .filter((r) => r.method === method)
      .sort((a, b) => a.priority - b.priority);

  const addRoutingRule = async (method: string, acquirerId: string) => {
    const existing = getRulesForMethod(method);
    if (existing.some((r) => r.acquirer_id === acquirerId)) {
      toast.error("Adquirente já adicionada para este método");
      return;
    }
    const nextPriority =
      existing.length > 0
        ? Math.max(...existing.map((r) => r.priority)) + 1
        : 1;

    try {
      await apiService.modules.adminConfig.createRoutingRule({
        method,
        acquirer_id: acquirerId,
        priority: nextPriority,
        is_active: true,
        weight: 100,
      });
      toast.success("Regra adicionada");
      await invalidateRoutingRules();
    } catch (error) {
      toast.error("Erro ao adicionar regra");
      console.error(error);
    }
  };

  const removeRoutingRule = async (ruleId: string) => {
    try {
      await apiService.modules.adminConfig.deleteRoutingRule(Number(ruleId));
      toast.success("Regra removida");
      await invalidateRoutingRules();
    } catch (error) {
      toast.error("Erro ao remover regra");
      console.error(error);
    }
  };

  const toggleRoutingRule = async (rule: IRoutingRule) => {
    try {
      await apiService.modules.adminConfig.updateRoutingRule(Number(rule.id), {
        is_active: !rule.is_active,
      });
      await invalidateRoutingRules();
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const updateRulePriority = async (ruleId: string, newPriority: number) => {
    try {
      await apiService.modules.adminConfig.updateRoutingRule(Number(ruleId), {
        priority: newPriority,
      });
      await invalidateRoutingRules();
    } catch {
      toast.error("Erro ao atualizar prioridade");
    }
  };

  const getAcquirerName = (acquirerId: string) => {
    const conn = connections.find((c) => c.id === acquirerId);
    return conn?.name || "Desconhecida";
  };

  const getAcquirerLogo = (acquirerId: string) => {
    const conn = connections.find((c) => c.id === acquirerId);
    return conn ? getAcquirerLogoSrc(conn) : null;
  };

  const renderRoutingDeposit = () => {
    if (loadingRouting || loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      );
    }

    if (activeConnections.length === 0) {
      return (
        <div className="admin-surface px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Link2 size={18} className="text-primary" />
          </div>
          <p className="mb-1 text-base font-semibold text-foreground">
            Nenhuma adquirente conectada
          </p>
          <p className="text-sm text-muted-foreground">
            Conecte e ative uma adquirente na aba "Conexões" para configurar o
            roteamento.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Regras de roteamento por método
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Configure a prioridade das adquirentes. Se a primeira falhar, o
              sistema tenta automaticamente a próxima.
            </p>
          </div>
          <div className="liquid-glass-control inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground">
            <RotateCcw size={13} />
            Failover automático
          </div>
        </div>

        {METHODS_DEPOSIT.map((method) => {
          const rules = getRulesForMethod(method);
          const methodAcquirers = activeConnections.filter((c) =>
            c.methods.some((m) => m.toLowerCase() === method.toLowerCase()),
          );
          const availableAcquirers = methodAcquirers.filter(
            (c) => !rules.some((r) => r.acquirer_id === c.id),
          );

          return (
            <div key={method} className="admin-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-2 text-xs font-semibold uppercase tracking-wider"
                  >
                    {method}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {rules.length === 0
                      ? "Sem adquirente"
                      : `${rules.length} adquirente${
                          rules.length > 1 ? "s" : ""
                        }`}
                  </span>
                </div>
                <Select
                  onValueChange={(val) => addRoutingRule(method, val)}
                  disabled={
                    availableAcquirers.length === 0 &&
                    methodAcquirers.length > 0
                  }
                >
                  <SelectTrigger className="h-7 w-auto text-sm gap-1.5 border-dashed">
                    <Plus size={12} />
                    <SelectValue
                      placeholder={
                        activeConnections.length === 0
                          ? "Nenhuma adquirente"
                          : availableAcquirers.length === 0 &&
                              methodAcquirers.length > 0
                            ? "Todas vinculadas"
                            : "Vincular adquirente"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableAcquirers.length > 0
                      ? availableAcquirers
                      : activeConnections.filter(
                          (c) => !rules.some((r) => r.acquirer_id === c.id),
                        )
                    ).map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {rules.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma adquirente configurada para {method.toUpperCase()}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {rules.map((rule, idx) => {
                    const logo = getAcquirerLogo(rule.acquirer_id);
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/25"
                      >
                        <GripVertical
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                          {idx + 1}
                        </div>

                        {logo && (
                          <img
                            src={logo}
                            alt=""
                            className="h-5 w-5 shrink-0 object-contain"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground">
                            {getAcquirerName(rule.acquirer_id)}
                          </span>
                          {idx === 0 && (
                            <Badge
                              className="ml-2 border-primary/25 bg-primary/10 px-1.5 py-0 text-xs text-primary"
                              variant="outline"
                            >
                              Principal
                            </Badge>
                          )}
                          {idx > 0 && (
                            <Badge
                              className="ml-2 px-1.5 py-0 text-xs"
                              variant="outline"
                            >
                              Fallback {idx}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                const prevRule = rules[idx - 1];
                                updateRulePriority(rule.id, prevRule.priority);
                                updateRulePriority(prevRule.id, rule.priority);
                              }}
                              title="Subir prioridade"
                            >
                              <span className="text-xs">▲</span>
                            </Button>
                          )}
                          {idx < rules.length - 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                const nextRule = rules[idx + 1];
                                updateRulePriority(rule.id, nextRule.priority);
                                updateRulePriority(nextRule.id, rule.priority);
                              }}
                              title="Descer prioridade"
                            >
                              <span className="text-xs">▼</span>
                            </Button>
                          )}
                        </div>

                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRoutingRule(rule)}
                          className="scale-75"
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive/60 hover:text-destructive"
                          onClick={() => removeRoutingRule(rule.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderRoutingWithdrawal = () => {
    if (loadingRouting || loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      );
    }

    if (activeConnections.length === 0) {
      return (
        <div className="admin-surface px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Link2 size={18} className="text-primary" />
          </div>
          <p className="mb-1 text-base font-semibold text-foreground">
            Nenhuma adquirente conectada
          </p>
          <p className="text-sm text-muted-foreground">
            Conecte e ative uma adquirente na aba "Conexões" para configurar o
            roteamento de saque.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Regras de roteamento de saque
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Configure a prioridade das adquirentes para saques. Saques PIX via
              Woovi usam o roteamento de depósito PIX (aba Depósito, method
              pix).
            </p>
          </div>
          <div className="liquid-glass-control inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground">
            <RotateCcw size={13} />
            Failover automático
          </div>
        </div>

        {METHODS_WITHDRAWAL.map((method) => {
          const routeMethod = `withdrawal_${method}`;
          const rules = getRulesForMethod(routeMethod);
          const availableAcquirers = activeConnections.filter(
            (c) =>
              c.methods.some((m) => m.toLowerCase() === method.toLowerCase()) &&
              !rules.some((r) => r.acquirer_id === c.id),
          );

          const methodLabels: Record<string, string> = {
            pix: "PIX",
            ted: "TED",
            crypto: "Crypto",
          };

          return (
            <div key={method} className="admin-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-2 text-xs font-semibold uppercase tracking-wider"
                  >
                    {methodLabels[method] || method}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {rules.length === 0
                      ? "Sem adquirente"
                      : `${rules.length} adquirente${
                          rules.length > 1 ? "s" : ""
                        }`}
                  </span>
                </div>
                {availableAcquirers.length > 0 && (
                  <Select
                    onValueChange={(val) => addRoutingRule(routeMethod, val)}
                  >
                    <SelectTrigger className="h-7 w-auto text-sm gap-1.5 border-dashed">
                      <Plus size={12} />
                      <SelectValue placeholder="Adicionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAcquirers.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {rules.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma adquirente configurada para saque via{" "}
                    {methodLabels[method] || method.toUpperCase()}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {rules.map((rule, idx) => {
                    const logo = getAcquirerLogo(rule.acquirer_id);
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/25"
                      >
                        <GripVertical
                          size={14}
                          className="shrink-0 text-muted-foreground"
                        />
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                          {idx + 1}
                        </div>
                        {logo && (
                          <img
                            src={logo}
                            alt=""
                            className="h-5 w-5 shrink-0 object-contain"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground">
                            {getAcquirerName(rule.acquirer_id)}
                          </span>
                          {idx === 0 && (
                            <Badge
                              className="ml-2 border-primary/25 bg-primary/10 px-1.5 py-0 text-xs text-primary"
                              variant="outline"
                            >
                              Principal
                            </Badge>
                          )}
                          {idx > 0 && (
                            <Badge
                              className="ml-2 px-1.5 py-0 text-xs"
                              variant="outline"
                            >
                              Fallback {idx}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                const prev = rules[idx - 1];
                                updateRulePriority(rule.id, prev.priority);
                                updateRulePriority(prev.id, rule.priority);
                              }}
                              title="Subir prioridade"
                            >
                              <span className="text-xs">▲</span>
                            </Button>
                          )}
                          {idx < rules.length - 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                const next = rules[idx + 1];
                                updateRulePriority(rule.id, next.priority);
                                updateRulePriority(next.id, rule.priority);
                              }}
                              title="Descer prioridade"
                            >
                              <span className="text-xs">▼</span>
                            </Button>
                          )}
                        </div>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRoutingRule(rule)}
                          className="scale-75"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive/60 hover:text-destructive"
                          onClick={() => removeRoutingRule(rule.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // const renderPlaceholder = () => {
  //   const current = tabs.find((t) => t.key === activeTab)!;
  //   return (
  //     <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
  //       <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
  //         <current.icon size={18} className="text-muted-foreground/40" />
  //       </div>
  //       <p className="text-sm font-medium text-foreground mb-1">
  //         {current.label}
  //       </p>
  //       <p className="text-xs text-muted-foreground">
  //         Em breve esta seção estará disponível.
  //       </p>
  //     </div>
  //   );
  // };

  const COST_METHODS_DEPOSIT = ["pix", "card", "boleto", "crypto"];
  const COST_METHODS_WITHDRAWAL = ["pix", "ted", "crypto"];
  const methodLabel: Record<string, string> = {
    pix: "PIX",
    card: "Cartão",
    boleto: "Boleto",
    crypto: "Crypto",
    ted: "TED",
  };

  const getCost = (acquirerId: string, opType: string, method: string) =>
    costs.find(
      (c) =>
        c.acquirer_id === acquirerId &&
        c.operation_type === opType &&
        c.method === method,
    );

  const updateCostLocal = (
    acquirerId: string,
    opType: string,
    method: string,
    field: "fixed_cost" | "variable_cost" | "min_cost",
    value: number,
  ) => {
    setCosts((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.acquirer_id === acquirerId &&
          c.operation_type === opType &&
          c.method === method,
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      }
      return [
        ...prev,
        {
          acquirer_id: acquirerId,
          operation_type: opType as "deposit" | "withdrawal",
          method,
          fixed_cost: 0,
          variable_cost: 0,
          min_cost: 0,
          [field]: value,
        },
      ];
    });
  };

  const saveCostsForAcquirer = async (acquirerId: string) => {
    setSavingCosts(true);
    try {
      const acquirerCosts = costs.filter((c) => c.acquirer_id === acquirerId);
      await apiService.modules.adminConfig.saveAcquirerCosts(
        Number(acquirerId),
        acquirerCosts as unknown as Record<string, unknown>[],
      );
      toast.success("Custos salvos com sucesso");
      await invalidateCosts();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        toast.error(err.message || "Erro ao salvar custos");
      } else {
        toast.error("Erro ao salvar custos");
      }
    } finally {
      setSavingCosts(false);
    }
  };

  const renderCosts = () => {
    if (loadingCosts)
      return (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      );

    const connectedAcquirers = connections.filter((c) => c.is_active);

    if (connectedAcquirers.length === 0) {
      return (
        <div className="admin-surface px-6 py-12 text-center">
          <p className="text-base text-muted-foreground">
            Nenhuma adquirente ativa. Configure uma conexão primeiro.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="mb-4 text-sm text-muted-foreground">
          Configure os custos que você paga para cada adquirente por tipo de
          operação e método. Isso será usado para calcular o lucro líquido nas
          métricas.
        </p>

        {connectedAcquirers.map((conn) => {
          const isExpanded = expandedCostAcquirer === conn.id;
          const logo = getAcquirerLogoSrc(conn);

          return (
            <div key={conn.id} className="admin-surface overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setExpandedCostAcquirer(isExpanded ? null : conn.id)
                }
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/25"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {logo ? (
                    <img
                      src={logo}
                      alt={conn.name}
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <AcquirerBrandLogo
                      connection={conn}
                      imageClassName="w-6 h-6 object-contain"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {conn.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {
                      costs.filter(
                        (c) =>
                          c.acquirer_id === conn.id &&
                          (c.fixed_cost > 0 || c.variable_cost > 0),
                      ).length
                    }{" "}
                    regra(s) configurada(s)
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="animate-fade-in space-y-6 border-t border-border/50 px-5 py-5">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Custos de Depósito (Venda)
                    </p>
                    <div className="space-y-2">
                      {COST_METHODS_DEPOSIT.map((method) => {
                        const cost = getCost(conn.id, "deposit", method);
                        return (
                          <div
                            key={method}
                            className="grid grid-cols-4 items-center gap-3"
                          >
                            <span className="text-sm font-medium text-muted-foreground">
                              {methodLabel[method]}
                            </span>
                            <div>
                              <label className="mb-0.5 block text-xs text-muted-foreground">
                                Fixo (R$)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cost?.fixed_cost ?? 0}
                                onChange={(e) =>
                                  updateCostLocal(
                                    conn.id,
                                    "deposit",
                                    method,
                                    "fixed_cost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-0.5 block text-xs text-muted-foreground">
                                Variável (%)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={cost?.variable_cost ?? 0}
                                onChange={(e) =>
                                  updateCostLocal(
                                    conn.id,
                                    "deposit",
                                    method,
                                    "variable_cost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-0.5 block text-xs text-muted-foreground">
                                Mínimo (R$)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cost?.min_cost ?? 0}
                                onChange={(e) =>
                                  updateCostLocal(
                                    conn.id,
                                    "deposit",
                                    method,
                                    "min_cost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Custos de Saque
                    </p>
                    <div className="space-y-2">
                      {COST_METHODS_WITHDRAWAL.map((method) => {
                        const cost = getCost(conn.id, "withdrawal", method);
                        return (
                          <div
                            key={method}
                            className="grid grid-cols-4 items-center gap-3"
                          >
                            <span className="text-sm font-medium text-muted-foreground">
                              {methodLabel[method]}
                            </span>
                            <div>
                              <label className="mb-0.5 block text-xs text-muted-foreground">
                                Fixo (R$)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cost?.fixed_cost ?? 0}
                                onChange={(e) =>
                                  updateCostLocal(
                                    conn.id,
                                    "withdrawal",
                                    method,
                                    "fixed_cost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-0.5 block text-xs text-muted-foreground">
                                Variável (%)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={cost?.variable_cost ?? 0}
                                onChange={(e) =>
                                  updateCostLocal(
                                    conn.id,
                                    "withdrawal",
                                    method,
                                    "variable_cost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-0.5 block text-xs text-muted-foreground">
                                Mínimo (R$)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cost?.min_cost ?? 0}
                                onChange={(e) =>
                                  updateCostLocal(
                                    conn.id,
                                    "withdrawal",
                                    method,
                                    "min_cost",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => saveCostsForAcquirer(conn.id)}
                      disabled={savingCosts}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {savingCosts ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Salvar custos
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTab = () => {
    switch (activeTab) {
      case "conexoes":
        return renderConnections();
      case "roteamento-deposito":
        return renderRoutingDeposit();
      case "roteamento-saque":
        return renderRoutingWithdrawal();
      case "regras-custos":
        return renderCosts();
      case "guia":
        return <AcquirerGuideTab />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 animate-fade-in">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Sistema
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
            Adquirentes
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Configure o roteamento inteligente de pagamentos e adicione novas
            conexões de adquirentes.
          </p>
        </header>

        <div className="liquid-glass-control mb-8 flex flex-wrap items-center gap-0.5 rounded-2xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-white text-[#0F0617] shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {renderTab()}
        </div>
      </div>
    </AdminLayout>
  );
}
