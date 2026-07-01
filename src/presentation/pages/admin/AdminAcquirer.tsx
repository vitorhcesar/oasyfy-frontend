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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Adquirentes conectadas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie as conexões com provedores de pagamento.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto">
            <Link2 size={22} className="text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Nenhuma adquirente cadastrada
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Carregue Woovi e Cartwave para habilitar o botão{" "}
              <strong>Configurar</strong> e definir credenciais + roteamento PIX.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={ensureDefaultConnections}
            disabled={bootstrapping}
          >
            {bootstrapping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Carregar adquirentes padrão
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="rounded-xl border border-border/40 bg-card p-4 flex items-center gap-4 hover:border-border/80 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-background border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                <AcquirerBrandLogo connection={conn} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {conn.name}
                  </span>
                  <Badge
                    variant={
                      conn.status === "connected" ? "default" : "secondary"
                    }
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      conn.status === "connected" &&
                        "bg-primary/10 text-primary border-primary/20",
                      conn.status === "error" &&
                        "bg-destructive/10 text-destructive border-destructive/20",
                    )}
                  >
                    {conn.status === "connected"
                      ? "Conectada"
                      : conn.status === "error"
                        ? "Erro"
                        : "Desconectada"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {conn.description}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {conn.methods.map((m) => (
                    <span
                      key={m}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={conn.is_active}
                  onCheckedChange={() => toggleActive(conn)}
                  className="scale-90"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => openConfig(conn)}
                >
                  <Settings2 size={13} />
                  Configurar
                </Button>
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
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </div>
      );
    }

    if (activeConnections.length === 0) {
      return (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Link2 size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Nenhuma adquirente conectada
          </p>
          <p className="text-xs text-muted-foreground">
            Conecte e ative uma adquirente na aba "Conexões" para configurar o
            roteamento.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Regras de roteamento por método
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure a prioridade das adquirentes. Se a primeira falhar, o
              sistema tenta automaticamente a próxima.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5">
            <RotateCcw size={11} />
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
            <div
              key={method}
              className="rounded-xl border border-border/40 bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold uppercase tracking-wider px-2"
                  >
                    {method}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
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
                  <SelectTrigger className="h-7 w-auto text-[11px] gap-1.5 border-dashed">
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
                  <p className="text-xs text-muted-foreground">
                    Nenhuma adquirente configurada para {method.toUpperCase()}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {rules.map((rule, idx) => {
                    const logo = getAcquirerLogo(rule.acquirer_id);
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 transition-colors"
                      >
                        <GripVertical
                          size={14}
                          className="text-muted-foreground/30 shrink-0"
                        />

                        <div className="flex items-center justify-center w-6 h-6 rounded bg-muted/40 text-[10px] font-bold text-muted-foreground shrink-0">
                          {idx + 1}
                        </div>

                        {logo && (
                          <img
                            src={logo}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground">
                            {getAcquirerName(rule.acquirer_id)}
                          </span>
                          {idx === 0 && (
                            <Badge
                              className="ml-2 text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20"
                              variant="outline"
                            >
                              Principal
                            </Badge>
                          )}
                          {idx > 0 && (
                            <Badge
                              className="ml-2 text-[9px] px-1 py-0 bg-accent text-accent-foreground"
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
                              <span className="text-[10px]">▲</span>
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
                              <span className="text-[10px]">▼</span>
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
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </div>
      );
    }

    if (activeConnections.length === 0) {
      return (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Link2 size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Nenhuma adquirente conectada
          </p>
          <p className="text-xs text-muted-foreground">
            Conecte e ative uma adquirente na aba "Conexões" para configurar o
            roteamento de saque.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Regras de roteamento de saque
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure a prioridade das adquirentes para saques. Saques PIX via
              Woovi usam o roteamento de depósito PIX (aba Depósito, method
              pix).
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5">
            <RotateCcw size={11} />
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
            <div
              key={method}
              className="rounded-xl border border-border/40 bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold uppercase tracking-wider px-2"
                  >
                    {methodLabels[method] || method}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
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
                    <SelectTrigger className="h-7 w-auto text-[11px] gap-1.5 border-dashed">
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
                  <p className="text-xs text-muted-foreground">
                    Nenhuma adquirente configurada para saque via{" "}
                    {methodLabels[method] || method.toUpperCase()}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {rules.map((rule, idx) => {
                    const logo = getAcquirerLogo(rule.acquirer_id);
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 transition-colors"
                      >
                        <GripVertical
                          size={14}
                          className="text-muted-foreground/30 shrink-0"
                        />
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-muted/40 text-[10px] font-bold text-muted-foreground shrink-0">
                          {idx + 1}
                        </div>
                        {logo && (
                          <img
                            src={logo}
                            alt=""
                            className="w-5 h-5 object-contain shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground">
                            {getAcquirerName(rule.acquirer_id)}
                          </span>
                          {idx === 0 && (
                            <Badge
                              className="ml-2 text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20"
                              variant="outline"
                            >
                              Principal
                            </Badge>
                          )}
                          {idx > 0 && (
                            <Badge
                              className="ml-2 text-[9px] px-1 py-0 bg-accent text-accent-foreground"
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
                              <span className="text-[10px]">▲</span>
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
                              <span className="text-[10px]">▼</span>
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
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      );

    const connectedAcquirers = connections.filter((c) => c.is_active);

    if (connectedAcquirers.length === 0) {
      return (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma adquirente ativa. Configure uma conexão primeiro.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground mb-4">
          Configure os custos que você paga para cada adquirente por tipo de
          operação e método. Isso será usado para calcular o lucro líquido nas
          métricas.
        </p>

        {connectedAcquirers.map((conn) => {
          const isExpanded = expandedCostAcquirer === conn.id;
          const logo = getAcquirerLogoSrc(conn);

          return (
            <div
              key={conn.id}
              className="rounded-xl border border-border/40 bg-card overflow-hidden"
            >
              {/* Acquirer header */}
              <button
                onClick={() =>
                  setExpandedCostAcquirer(isExpanded ? null : conn.id)
                }
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {logo ? (
                    <img
                      src={logo}
                      alt={conn.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <AcquirerBrandLogo
                      connection={conn}
                      imageClassName="w-6 h-6 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {conn.name}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
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
                <div className="border-t border-border/30 px-5 py-5 space-y-6 animate-fade-in">
                  {/* Deposit costs */}
                  <div>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                      Custos de Depósito (Venda)
                    </p>
                    <div className="space-y-2">
                      {COST_METHODS_DEPOSIT.map((method) => {
                        const cost = getCost(conn.id, "deposit", method);
                        return (
                          <div
                            key={method}
                            className="grid grid-cols-4 gap-3 items-center"
                          >
                            <span className="text-xs font-medium text-muted-foreground">
                              {methodLabel[method]}
                            </span>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60 mb-0.5 block">
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
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60 mb-0.5 block">
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
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60 mb-0.5 block">
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
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Withdrawal costs */}
                  <div>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                      Custos de Saque
                    </p>
                    <div className="space-y-2">
                      {COST_METHODS_WITHDRAWAL.map((method) => {
                        const cost = getCost(conn.id, "withdrawal", method);
                        return (
                          <div
                            key={method}
                            className="grid grid-cols-4 gap-3 items-center"
                          >
                            <span className="text-xs font-medium text-muted-foreground">
                              {methodLabel[method]}
                            </span>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60 mb-0.5 block">
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
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60 mb-0.5 block">
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
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground/60 mb-0.5 block">
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
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      onClick={() => saveCostsForAcquirer(conn.id)}
                      disabled={savingCosts}
                      className="gap-2 text-xs"
                    >
                      {savingCosts ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Salvar custos
                    </Button>
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
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">Adquirentes</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure o roteamento inteligente de pagamentos e adicione novas
            conexões de adquirentes.
          </p>
        </div>

        <div className="border-b border-border/40 mb-8 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium transition-all relative whitespace-nowrap",
                  activeTab === tab.key
                    ? "text-primary"
                    : "text-muted-foreground/60 hover:text-muted-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {renderTab()}
        </div>
      </div>
    </AdminLayout>
  );
}
