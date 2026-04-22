import { supabase } from "@/infrastructure/integrations/supabase/client";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { useKycStatus } from "@/presentation/hooks/use-kyc-status";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
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
  PackageSearch,
  Plus,
  SearchCheck,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const GATEWAY_BASE = `${
  import.meta.env.VITE_SUPABASE_URL
}/functions/v1/api-gateway`;

const PERMISSIONS = [
  {
    id: "consulta",
    label: "Consulta",
    icon: SearchCheck,
    description: "Consultar transações e vendas",
    endpoints: ["GET /consulta"],
  },
  {
    id: "venda",
    label: "Venda",
    icon: CreditCard,
    description: "Criar vendas e gerar PIX",
    endpoints: ["POST /venda", "POST /pix"],
  },
  {
    id: "saque",
    label: "Saque",
    icon: Banknote,
    description: "Solicitar saques via API",
    endpoints: ["POST /saque"],
  },
  {
    id: "rastreio",
    label: "Rastreio",
    icon: PackageSearch,
    description: "Rastrear status de transações",
    endpoints: ["GET /rastreio"],
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
  const { kycApproved, loading: kycLoading } = useKycStatus();

  const tabs = [
    { id: "keys" as const, label: "Chaves API", icon: Key },
    { id: "ips" as const, label: "IPs Autorizados a Sacar", icon: Shield },
  ];

  if (kycApproved === false && !kycLoading) {
    return (
      <SellerLayout>
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            KYC pendente
          </h2>
          <p className="text-sm text-muted-foreground">
            Você precisa ter seu KYC aprovado para acessar a API. Complete ou
            aguarde a aprovação dos seus documentos.
          </p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-1">API</h1>
        <p className="text-xs text-muted-foreground mb-6">
          Gerencie suas chaves de acesso e restrições de IP
        </p>

        <div className="flex gap-1 border-b border-border/40 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
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
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("api_keys")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setKeys(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleCreate = async (name: string, permissions: string[]) => {
    if (!user) return;
    const apiKey = generateKey();
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        seller_id: user.id,
        name,
        api_key: apiKey,
        permissions,
      })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar chave");
      return;
    }
    setKeys((prev) => [data, ...prev]);
    setVisibleKeys((prev) => ({ ...prev, [data.id]: true }));
    toast.success("Chave criada com sucesso");
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setShowDeleteModal(null);
    toast.success("Chave excluída");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Suas chaves</h2>
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
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
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
                  <span className="text-xs px-1.5 py-px rounded bg-emerald-500/15 text-emerald-500 font-medium uppercase tracking-wide">
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
                      className="text-[11px] md:text-xs px-1.5 py-px rounded bg-muted text-muted-foreground uppercase tracking-wide"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowDeleteModal(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-foreground mb-2">
              Excluir chave API
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Essa ação é irreversível. Todas as integrações que usam essa chave
              deixarão de funcionar imediatamente.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6"
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
                      <span className="text-[11px] md:text-xs opacity-70 block">
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
                <p className="text-[11px] md:text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-border/20">
                  Header:{" "}
                  <code className="text-[11px] md:text-xs">
                    x-api-key: sua_chave
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-border/30">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={creating}
            onClick={handleSubmit}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
          >
            {creating && <Loader2 size={12} className="animate-spin" />}
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthorizedIpsTab() {
  const { user } = useAuthStore();
  const [ips, setIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("authorized_ips")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setIps(data || []);
        setLoading(false);
      });
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newIp.trim()) return;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp.trim())) return toast.error("IP inválido");
    setAdding(true);
    const { data, error } = await supabase
      .from("authorized_ips")
      .insert({ seller_id: user.id, ip_address: newIp.trim() })
      .select()
      .single();
    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "IP já cadastrado"
          : "Erro ao adicionar"
      );
      setAdding(false);
      return;
    }
    setIps((prev) => [data, ...prev]);
    setNewIp("");
    toast.success("IP adicionado");
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("authorized_ips")
      .delete()
      .eq("id", id);
    if (error) return toast.error("Erro ao remover");
    setIps((prev) => prev.filter((ip) => ip.id !== id));
    setShowDeleteModal(null);
    toast.success("IP removido");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
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
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowDeleteModal(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-foreground mb-2">
              Remover IP
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Esse IP será removido da lista de autorizados. Requisições desse
              endereço poderão ser bloqueadas.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
