import cartwaveLogo from "@/assets/cartwave-logo.png";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
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
  Calculator,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
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
import { useCallback, useEffect, useState } from "react";
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
  { key: "regras-custos", label: "Regras de custos", icon: Calculator },
] as const;

type TTabKey = (typeof tabs)[number]["key"];

const METHODS_DEPOSIT = ["pix", "card", "boleto", "crypto"] as const;
const METHODS_WITHDRAWAL = ["pix", "ted", "crypto"] as const;

interface IRoutingRule {
  id: string;
  method: string;
  acquirer_id: string;
  priority: number;
  is_active: boolean;
  weight: number;
}

const logoMap: Record<string, string> = {
  cartwave: cartwaveLogo,
};

interface IAcquirerConnection {
  id: string;
  name: string;
  logo_key: string | null;
  description: string | null;
  status: string;
  methods: string[];
  api_url: string;
  client_id: string;
  access_token: string;
  hmac_key: string;
  branch_id: string;
  account_number: string;
  is_active: boolean;
}

interface IAcquirerCost {
  id?: string;
  acquirer_id: string;
  operation_type: "deposit" | "withdrawal";
  method: string;
  fixed_cost: number;
  variable_cost: number;
  min_cost: number;
}

export default function AdminAcquirer() {
  const apiService = useApiService();
  const [activeTab, setActiveTab] = useState<TTabKey>("conexoes");
  const [connections, setConnections] = useState<IAcquirerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [configModal, setConfigModal] = useState<IAcquirerConnection | null>(
    null,
  );
  const [showToken, setShowToken] = useState(false);
  const [showHmac, setShowHmac] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    accessToken: "",
    hmacKey: "",
    branchId: "",
    accountNumber: "",
  });
  const [reconfiguring, setReconfiguring] = useState(false);

  // Routing state
  const [routingRules, setRoutingRules] = useState<IRoutingRule[]>([]);
  const [loadingRouting, setLoadingRouting] = useState(true);

  // Cost state
  const [costs, setCosts] = useState<IAcquirerCost[]>([]);
  const [loadingCosts, setLoadingCosts] = useState(true);
  const [savingCosts, setSavingCosts] = useState(false);
  const [expandedCostAcquirer, setExpandedCostAcquirer] = useState<
    string | null
  >(null);

  const activeConnections = connections.filter(
    (c) => c.is_active && c.status === "connected",
  );

  const fetchConnections = async () => {
    try {
      const data = await apiService.modules.adminConfig.listAcquirerConnections();
      setConnections(
        data.map((c) => {
          const row = c as unknown as IAcquirerConnection;
          return {
            ...row,
            client_id: row.client_id ?? "",
            access_token: row.access_token ?? "",
            hmac_key: row.hmac_key ?? "",
            branch_id: row.branch_id ?? "",
            account_number: row.account_number ?? "",
          };
        }),
      );
    } catch (error) {
      toast.error("Erro ao carregar adquirentes");
      console.error(error);
    }
    setLoading(false);
  };

  const fetchRoutingRules = useCallback(async () => {
    try {
      const data = await apiService.modules.adminConfig.listRoutingRules();
      setRoutingRules((data as unknown as IRoutingRule[]) || []);
    } catch (error) {
      console.error(error);
    }
    setLoadingRouting(false);
  }, [apiService]);

  const fetchCosts = useCallback(async () => {
    setLoadingCosts(true);
    try {
      const data = await apiService.modules.adminConfig.listAcquirerCosts();
      setCosts((data as unknown as IAcquirerCost[]) || []);
    } catch (error) {
      console.error(error);
    }
    setLoadingCosts(false);
  }, [apiService]);

  useEffect(() => {
    fetchConnections();
    fetchRoutingRules();
    fetchCosts();
  }, [fetchRoutingRules, fetchCosts]);

  const isConfigured = (conn: IAcquirerConnection) =>
    !!(
      conn.client_id &&
      conn.access_token &&
      conn.hmac_key &&
      conn.branch_id &&
      conn.account_number
    );

  const openConfig = (conn: IAcquirerConnection) => {
    const configured = isConfigured(conn);
    setFormData({
      clientId: configured ? "" : conn.client_id || "",
      accessToken: configured ? "" : conn.access_token || "",
      hmacKey: configured ? "" : conn.hmac_key || "",
      branchId: configured ? "" : conn.branch_id || "",
      accountNumber: configured ? "" : conn.account_number || "",
    });
    setShowToken(false);
    setShowHmac(false);
    setConfigModal(conn);
  };

  const saveConfig = async () => {
    if (!configModal) return;
    setSaving(true);

    const hasCredentials =
      formData.clientId &&
      formData.accessToken &&
      formData.hmacKey &&
      formData.branchId &&
      formData.accountNumber;

    try {
      await apiService.modules.adminConfig.updateAcquirerConnection(
        Number(configModal.id),
        {
          clientId: formData.clientId,
          accessToken: formData.accessToken,
          hmacKey: formData.hmacKey,
          branchId: formData.branchId,
          accountNumber: formData.accountNumber,
          status: hasCredentials ? "connected" : "disconnected",
          isActive: !!hasCredentials,
        },
      );
      toast.success(`Credenciais da ${configModal.name} salvas com sucesso!`);
      setConfigModal(null);
      fetchConnections();
    } catch (error) {
      toast.error("Erro ao salvar credenciais");
      console.error(error);
    }
    setSaving(false);
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
      fetchConnections();
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
      ) : (
        <div className="grid gap-3">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="rounded-xl border border-border/40 bg-card p-4 flex items-center gap-4 hover:border-border/80 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-background border border-border/30 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={conn.logo_key ? (logoMap[conn.logo_key] ?? "") : ""}
                  alt={conn.name}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
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

      <Dialog
        open={!!configModal}
        onOpenChange={() => {
          setConfigModal(null);
          setReconfiguring(false);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {configModal?.logo_key && (
                <img
                  src={logoMap[configModal.logo_key] || ""}
                  alt=""
                  className="w-6 h-6 object-contain"
                />
              )}
              Configurar {configModal?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
              <ExternalLink size={13} />
              <span>API Base: </span>
              <code className="text-foreground font-mono text-[11px]">
                {configModal?.api_url}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(configModal?.api_url || "");
                  toast.success("URL copiada");
                }}
              >
                <Copy
                  size={11}
                  className="text-muted-foreground hover:text-foreground"
                />
              </button>
            </div>

            {configModal && isConfigured(configModal) && !reconfiguring ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-foreground">
                      Credenciais configuradas
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        ID do Cliente
                      </span>
                      <p className="text-xs font-mono text-foreground">
                        ••••••••••••
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        Chave Secreta
                      </span>
                      <p className="text-xs font-mono text-foreground">
                        ••••••••••••
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        Chave HMAC
                      </span>
                      <p className="text-xs font-mono text-foreground">
                        ••••••••••••
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        Agência
                      </span>
                      <p className="text-xs font-mono text-foreground">••••</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        Nº da Conta
                      </span>
                      <p className="text-xs font-mono text-foreground">
                        ••••••
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Por segurança, as credenciais não podem ser visualizadas
                    após salvas.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5"
                  onClick={() => setReconfiguring(true)}
                >
                  <Settings2 size={13} />
                  Reconfigurar credenciais
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">ID do Cliente (Client ID)</Label>
                  <Input
                    placeholder="9E54779D..."
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, clientId: e.target.value }))
                    }
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Chave Secreta (Access Token)
                  </Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="eyJhbGciOiJIUzI1NiIs..."
                      value={formData.accessToken}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          accessToken: e.target.value,
                        }))
                      }
                      className="pr-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Chave HMAC</Label>
                  <div className="relative">
                    <Input
                      type={showHmac ? "text" : "password"}
                      placeholder="57373705c83bc5efe..."
                      value={formData.hmacKey}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, hmacKey: e.target.value }))
                      }
                      className="pr-10 text-xs font-mono"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowHmac(!showHmac)}
                    >
                      {showHmac ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Agência (Branch)</Label>
                    <Input
                      placeholder="0001"
                      value={formData.branchId}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, branchId: e.target.value }))
                      }
                      className="text-xs font-mono"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nº da Conta</Label>
                    <Input
                      placeholder="401050"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          accountNumber: e.target.value,
                        }))
                      }
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfigModal(null);
                setReconfiguring(false);
              }}
            >
              Cancelar
            </Button>
            {(!configModal || !isConfigured(configModal) || reconfiguring) && (
              <Button size="sm" onClick={saveConfig} disabled={saving}>
                {saving && (
                  <Loader2 size={13} className="animate-spin mr-1.5" />
                )}
                Salvar credenciais
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      fetchRoutingRules();
    } catch (error) {
      toast.error("Erro ao adicionar regra");
      console.error(error);
    }
  };

  const removeRoutingRule = async (ruleId: string) => {
    try {
      await apiService.modules.adminConfig.deleteRoutingRule(Number(ruleId));
      toast.success("Regra removida");
      fetchRoutingRules();
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
      fetchRoutingRules();
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const updateRulePriority = async (ruleId: string, newPriority: number) => {
    try {
      await apiService.modules.adminConfig.updateRoutingRule(Number(ruleId), {
        priority: newPriority,
      });
      fetchRoutingRules();
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
    return conn?.logo_key ? (logoMap[conn.logo_key] ?? null) : null;
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
              Configure a prioridade das adquirentes para saques. Se a primeira
              falhar, o sistema tenta a próxima.
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
      await fetchCosts();
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
          const logo = conn.logo_key ? logoMap[conn.logo_key] : null;

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
                    <Link2 size={16} className="text-muted-foreground" />
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
