import { getApiBaseUrl } from "@/infra/http/services/api/api-env";
import ModalPortal from "@/presentation/components/ModalPortal";
import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useKycStatus } from "@/presentation/hooks/use-kyc-status";
import useSellerProfileQuery from "@/presentation/hooks/use-seller-profile-query";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import { buildApiAccessSupportUrl } from "@/presentation/utils/build-api-access-support-url";
import { cn } from "@/presentation/utils/cn";
import {
  AlertTriangle,
  Banknote,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  MessageCircle,
  PackageSearch,
  Plus,
  SearchCheck,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const GATEWAY_BASE = `${getApiBaseUrl()}/api/v1/gateway`;

const PERMISSIONS = [
  {
    id: "consulta",
    label: "Consulta",
    icon: SearchCheck,
    description: "Consultar transações e vendas",
    endpoints: ["GET /transactions"],
  },
  {
    id: "venda",
    label: "Venda",
    icon: CreditCard,
    description: "Criar vendas e gerar PIX",
    endpoints: ["POST /sales", "POST /pix"],
  },
  {
    id: "saque",
    label: "Saque",
    icon: Banknote,
    description: "Solicitar saques via API",
    endpoints: ["POST /withdrawals"],
  },
  {
    id: "rastreio",
    label: "Rastreio",
    icon: PackageSearch,
    description: "Rastrear status de transações",
    endpoints: ["GET /tracking"],
  },
];

function generateKey() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "sk_live_OAS_";
  for (let i = 0; i < 32; i++)
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export default function SellerApi() {
  const [activeTab, setActiveTab] = useState<"keys" | "ips">("keys");
  const { user } = useAuthContext();
  const { kycApproved, loading: kycLoading } = useKycStatus();
  const { apiAccessEnabled, isLoading: kycQueryLoading } =
    useSellerKycSubmissionQuery();
  const { data: profile } = useSellerProfileQuery();

  const tabs = [
    { id: "keys" as const, label: "Chaves API", icon: Key },
    { id: "ips" as const, label: "IPs Autorizados a Sacar", icon: Shield },
  ];

  const openSupport = () => {
    const url = buildApiAccessSupportUrl({
      accountId: profile?.accountId,
      email: profile?.email ?? user?.email,
    });
    if (!url) {
      toast.error(
        "Canal de suporte não configurado. Contate a administração Omegapay.",
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!apiAccessEnabled && !kycLoading && !kycQueryLoading) {
    return (
      <SellerLayout>
        <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
          <div className="mx-auto max-w-lg py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Key size={24} className="text-primary" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              API disponível sob liberação
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Sua conta ainda não tem acesso à API. Solicite a liberação com o
              suporte Omegapay.
            </p>
            <button
              type="button"
              onClick={openSupport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle size={16} />
              Falar com o suporte
            </button>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (kycApproved === false && !kycLoading) {
    return (
      <SellerLayout>
        <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
          <div className="mx-auto max-w-lg py-20 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              KYC pendente
            </h2>
            <p className="text-sm text-muted-foreground">
              Você precisa ter seu KYC aprovado para acessar a API. Complete ou
              aguarde a aprovação dos seus documentos.
            </p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Integração"
          title="API"
          description="Gerencie suas chaves de acesso e restrições de IP"
        />

        <div className="liquid-glass-control mb-6 flex flex-wrap items-center gap-0.5 rounded-2xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-white text-[#0F0617] shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <tab.icon size={14} strokeWidth={1.8} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "keys" && <ApiKeysTab />}
        {activeTab === "ips" && <AuthorizedIpsTab />}
      </div>
    </SellerLayout>
  );
}

function ApiKeysTab() {
  const apiService = useApiService();
  const [keys, setKeys] = useState<
    {
      id: number;
      name: string;
      api_key: string;
      permissions: string[];
      created_at: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  useEffect(() => {
    apiService.modules.sellerPortal
      .listApiKeys()
      .then((data) => {
        setKeys(
          data.map((k) => ({
            id: k.id,
            name: k.name,
            api_key: k.apiKey,
            permissions: k.permissions,
            created_at: k.createdAt,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [apiService]);

  const handleCreate = async (name: string, permissions: string[]) => {
    const apiKey = generateKey();
    try {
      const data = await apiService.modules.sellerPortal.createApiKey({
        name,
        apiKey,
        permissions,
      });
      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          api_key: data.apiKey,
          permissions: data.permissions,
          created_at: data.createdAt,
        },
        ...prev,
      ]);
      setVisibleKeys((prev) => ({ ...prev, [data.id]: true }));
      toast.success("Chave criada com sucesso");
      setShowCreateModal(false);
    } catch {
      toast.error("Erro ao criar chave");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.modules.sellerPortal.deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setShowDeleteModal(null);
      toast.success("Chave excluída");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="admin-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Suas chaves</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
        >
          <Plus size={13} />
          Gerar nova chave
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          Nenhuma chave API criada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/20 border border-border/30"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs px-1.5 py-px rounded bg-success/15 text-success font-medium uppercase tracking-wide">
                    Live
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {key.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(key.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p
                  className={`text-sm font-mono text-foreground transition-all ${
                    !visibleKeys[key.id] ? "blur-sm select-none" : ""
                  }`}
                >
                  {key.api_key}
                </p>
                <div className="flex gap-1 mt-1">
                  {(key.permissions || []).map((p: string) => (
                    <span
                      key={p}
                      className="text-sm md:text-xs px-1.5 py-px rounded bg-muted text-muted-foreground uppercase tracking-wide"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() =>
                    setVisibleKeys((prev) => ({
                      ...prev,
                      [key.id]: !prev[key.id],
                    }))
                  }
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  {visibleKeys[key.id] ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(key.api_key);
                    toast.success("Chave copiada");
                  }}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setShowDeleteModal(key.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs md:text-sm text-muted-foreground/60">
        Nunca compartilhe suas chaves API. Elas concedem acesso total à sua
        conta.
      </p>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
            onClick={() => setShowDeleteModal(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 text-base font-semibold text-foreground">
                Excluir chave API
              </h2>
              <p className="mb-5 text-xs text-muted-foreground">
                Essa ação é irreversível. Todas as integrações que usam essa chave
                deixarão de funcionar imediatamente.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="rounded-lg bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground transition-opacity hover:opacity-90"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

function CreateKeyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, permissions: string[]) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const togglePerm = (id: string) => {
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Informe um nome para a chave");
    if (permissions.length === 0)
      return toast.error("Selecione ao menos uma permissão");
    setCreating(true);
    await onCreate(name.trim(), permissions);
    setCreating(false);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">
            Criar chave de API
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
              Nome
            </label>
            <input
              type="text"
              placeholder="Ex: Entradas e saídas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-muted/20 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs md:text-sm font-medium text-muted-foreground mb-2 block">
              Permissões de acesso
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map((perm) => {
                const selected = permissions.includes(perm.id);
                return (
                  <button
                    key={perm.id}
                    onClick={() => togglePerm(perm.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors text-left ${
                      selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/40 bg-muted/10 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <perm.icon size={16} strokeWidth={1.8} />
                    <div className="min-w-0">
                      <span className="text-xs md:text-sm font-medium block">
                        {perm.label}
                      </span>
                      <span className="text-sm md:text-xs opacity-70 block">
                        {perm.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {permissions.length > 0 && (
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                <ExternalLink size={10} />
                Endpoints habilitados
              </label>
              <div className="space-y-1.5 bg-muted/20 rounded-lg p-3 border border-border/30">
                {PERMISSIONS.filter((p) => permissions.includes(p.id)).flatMap(
                  (p) =>
                    p.endpoints.map((ep) => (
                      <div
                        key={ep}
                        className="flex items-center justify-between"
                      >
                        <code className="text-xs font-mono text-foreground">
                          {ep}
                        </code>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const route = ep.split(" ")[1];
                            navigator.clipboard.writeText(
                              `${GATEWAY_BASE}${route}`
                            );
                            toast.success("URL copiada");
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    ))
                )}
                <p className="text-sm md:text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-border/20">
                  Header:{" "}
                  <code className="text-sm md:text-xs">
                    x-api-key: sua_chave
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/30 pt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            disabled={creating}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {creating && <Loader2 size={12} className="animate-spin" />}
            Cadastrar
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

function AuthorizedIpsTab() {
  const apiService = useApiService();
  const [ips, setIps] = useState<
    { id: number; ip_address: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  useEffect(() => {
    apiService.modules.sellerPortal
      .listAuthorizedIps()
      .then((data) => {
        setIps(
          data.map((ip) => ({
            id: ip.id,
            ip_address: ip.ipAddress,
            created_at: ip.createdAt,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [apiService]);

  const handleAdd = async () => {
    if (!newIp.trim()) return;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) return toast.error("IP inválido");
    setAdding(true);
    try {
      const data = await apiService.modules.sellerPortal.createAuthorizedIp(
        newIp.trim(),
      );
      setIps((prev) => [
        {
          id: data.id,
          ip_address: data.ipAddress,
          created_at: data.createdAt,
        },
        ...prev,
      ]);
      setNewIp("");
      toast.success("IP adicionado");
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes("duplicate")
          ? "IP já cadastrado"
          : "Erro ao adicionar";
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.modules.sellerPortal.deleteAuthorizedIp(id);
      setIps((prev) => prev.filter((ip) => ip.id !== id));
      setShowDeleteModal(null);
      toast.success("IP removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="admin-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            IPs Autorizados
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Restrinja o acesso à API apenas para IPs específicos
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Ex: 192.168.1.100"
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
        >
          {adding && <Loader2 size={12} className="animate-spin" />}
          Adicionar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : ips.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nenhum IP cadastrado.
        </p>
      ) : (
        <div className="space-y-2">
          {ips.map((ip) => (
            <div
              key={ip.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20 border border-border/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">
                  {ip.ip_address}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(ip.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <button
                onClick={() => setShowDeleteModal(ip.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs md:text-sm text-muted-foreground/60">
        Se nenhum IP for cadastrado, a API aceita requisições de qualquer
        origem.
      </p>

      {showDeleteModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
            onClick={() => setShowDeleteModal(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 text-base font-semibold text-foreground">
                Remover IP
              </h2>
              <p className="mb-5 text-xs text-muted-foreground">
                Esse IP será removido da lista de autorizados. Requisições desse
                endereço poderão ser bloqueadas.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="rounded-lg bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground transition-opacity hover:opacity-90"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
