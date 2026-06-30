import { authClient } from "@/infra/auth/auth-client";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useFullSellerFeeQuery from "@/presentation/hooks/use-full-seller-fee-query";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import { useUserContext } from "@/presentation/context/UserContext";
import { translateError } from "@/presentation/utils/translate-error";
import {
  Copy,
  Loader2,
  LogOut,
  Monitor,
  Receipt,
  Shield,
  Smartphone,
  Upload,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function parseUserAgent(ua: string | null) {
  if (!ua)
    return {
      device: "Navegador",
      detail: "Navegador",
      icon: "desktop" as const,
    };
  const isIphone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIphone || isAndroid;
  let browser = "Navegador";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";
  let os = "";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (isIphone) os = "iPhone";
  else if (isAndroid) os = "Android";
  const device = os ? `${browser} em ${os}` : browser;
  return {
    device,
    detail: browser,
    icon: isMobile ? ("mobile" as const) : ("desktop" as const),
  };
}

function SecurityTab() {
  const apiService = useApiService();
  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      user_agent: string | null;
      ip_address: string;
      created_at: string;
    }>
  >([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutAll, setLogoutAll] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    apiService.modules.sellerPortal
      .listLoginLogs()
      .then((logs) => {
        setSessions(
          logs.map((log) => ({
            id: String(log.id),
            user_agent: log.userAgent,
            ip_address: log.ipAddress,
            created_at: log.createdAt,
          })),
        );
        setLoadingSessions(false);
      })
      .catch(() => {
        setSessions([]);
        setLoadingSessions(false);
      });
  }, [apiService]);

  const handleEndSession = async (sessionId: string, idx: number) => {
    const active = idx === 0 && isActive(sessions[0]?.created_at);
    try {
      await apiService.modules.sellerPortal.deleteLoginLog(Number(sessionId));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (active) {
        await authClient.signOut();
        window.location.href = "/login/seller";
        return;
      }
      toast.success("Sessão encerrada");
    } catch {
      toast.error("Erro ao encerrar sessão");
    }
  };

  const handleEndAll = async () => {
    await authClient.revokeSessions();
        window.location.href = "/login/seller";
  };

  const isActive = (createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return (
      date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  };

  const timeSince = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Segurança</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie o acesso à sua conta
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleEndAll}
            className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            <LogOut size={13} />
            Encerrar todas
          </button>
        )}
      </div>

      {/* Alterar senha */}
      <div className="flex items-center justify-between py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Alterar senha</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Proteja sua conta com uma senha forte
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="text-xs text-primary font-medium hover:text-primary/80 transition-colors"
        >
          Alterar
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                Alterar senha
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setLogoutAll(false);
                }}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                  Senha atual
                </label>
                <input
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-muted/20 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                  Nova senha
                </label>
                <input
                  type="password"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-muted/20 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-muted/20 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={logoutAll}
                  onChange={(e) => setLogoutAll(e.target.checked)}
                  className="mt-0.5 rounded border-border accent-primary"
                />
                <div>
                  <p className="text-xs font-medium text-foreground leading-tight">
                    Deslogar de todos os dispositivos
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Encerra todas as sessões ativas, inclusive esta.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/30">
              <div className="relative group/tip">
                <span className="text-xs md:text-sm text-muted-foreground cursor-help flex items-center gap-1">
                  Esqueceu? <span className="text-[11px] md:text-xs">ⓘ</span>
                </span>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block bg-card border border-border rounded-lg px-3 py-2 text-xs md:text-sm text-foreground shadow-lg w-56 z-10">
                  <span className="text-destructive font-medium">
                    Desconecte-se
                  </span>{" "}
                  e clique em{" "}
                  <span className="text-primary font-medium">
                    Esqueci minha senha
                  </span>{" "}
                  na tela de login.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setLogoutAll(false);
                  }}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={
                    changingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  onClick={async () => {
                    if (newPassword !== confirmPassword)
                      return toast.error("As senhas não coincidem");
                    if (newPassword.length < 6)
                      return toast.error("Mínimo de 6 caracteres");

                    setChangingPassword(true);

                    const { error } = await authClient.changePassword({
                      currentPassword,
                      newPassword,
                      revokeOtherSessions: logoutAll,
                    });
                    if (error) {
                      toast.error(
                        translateError(error.message ?? "") ||
                          "Erro ao alterar senha",
                      );
                    } else {
                      toast.success("Senha alterada com sucesso");
                      if (logoutAll) {
                        window.location.href = "/login/seller";
                        return;
                      }
                      setShowPasswordModal(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setLogoutAll(false);
                    }
                    setChangingPassword(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
                >
                  {changingPassword && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  Alterar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispositivos */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">
            Sessões ativas
          </h2>
          <span className="text-xs md:text-sm text-muted-foreground">
            {sessions.length} sessão{sessions.length !== 1 ? "ões" : ""}
          </span>
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-10">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10">
            Nenhuma sessão encontrada.
          </p>
        ) : (
          <div className="space-y-1">
            {sessions.map((session, idx) => {
              const parsed = parseUserAgent(session.user_agent);
              const active = idx === 0 && isActive(session.created_at);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {parsed.icon === "mobile" ? (
                      <Smartphone
                        size={15}
                        className="text-muted-foreground shrink-0"
                      />
                    ) : (
                      <Monitor
                        size={15}
                        className="text-muted-foreground shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {parsed.device}
                        </p>
                        {active ? (
                          <span className="text-[11px] md:text-xs px-1.5 py-px rounded bg-emerald-500/15 text-emerald-500 font-medium uppercase tracking-wide">
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[11px] md:text-xs px-1.5 py-px rounded bg-muted text-muted-foreground font-medium uppercase tracking-wide">
                            Expirado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 mt-0.5 text-xs md:text-sm text-muted-foreground">
                        <span>{session.ip_address || "—"}</span>
                        <span>·</span>
                        <span>{formatDate(session.created_at)}</span>
                        {active && (
                          <>
                            <span>·</span>
                            <span>{timeSince(session.created_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEndSession(session.id, idx)}
                    className="text-xs md:text-sm text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-3"
                  >
                    Encerrar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerSettings() {
  const user = useUserContext();
  const apiService = useApiService();
  const { submission } = useSellerKycSubmissionQuery();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "perfil" | "antecipacao" | "seguranca" | "taxas"
  >("perfil");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [accountId, setAccountId] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { data: sellerFee, isLoading: feesLoading } = useFullSellerFeeQuery();

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");

    apiService.modules.sellerPortal
      .getProfile()
      .then((profile) => {
        setFullName(profile.fullName || user.name || "");
        setAvatarUrl(profile.avatarUrl);
        setAccountId(profile.accountId || "");
        if (profile.email) setEmail(profile.email);
      })
      .finally(() => setLoading(false));
  }, [user, apiService]);

  useEffect(() => {
    if (!submission) return;
    if (submission.fullName) setFullName((prev) => prev || submission.fullName);
    if (submission.phone) setPhone(submission.phone);
  }, [submission]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Apenas arquivos png, jpeg, jpg e webp são aceitos");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      toast.error("O tamanho máximo é 30MB");
      return;
    }

    setUploading(true);
    try {
      const { avatarUrl: url } =
        await apiService.modules.sellerPortal.uploadAvatar(file);
      setAvatarUrl(url);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error("Erro ao enviar foto: " + (err.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    if (!phone.trim()) {
      toast.error("O telefone é obrigatório");
      return;
    }

    setSaving(true);
    try {
      await apiService.modules.sellerPortal.updateProfile(fullName);
      toast.success("Perfil salvo com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const copyId = () => {
    if (accountId) {
      navigator.clipboard.writeText(accountId);
      toast.success("ID copiado!");
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="flex-1 px-4 sm:px-8 py-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar Tabs */}
          <nav className="lg:w-52 flex-shrink-0 space-y-0.5">
            {[
              { key: "perfil" as const, label: "Perfil", icon: User },
              {
                key: "antecipacao" as const,
                label: "Antecipação de valores",
                icon: Wallet,
              },
              { key: "seguranca" as const, label: "Segurança", icon: Shield },
              { key: "taxas" as const, label: "Minhas taxas", icon: Receipt },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                  activeTab === tab.key
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon
                  size={16}
                  className="flex-shrink-0"
                  strokeWidth={activeTab === tab.key ? 2.2 : 1.8}
                />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "perfil" && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-foreground">
                    Detalhes da conta
                  </h1>
                  <button
                    onClick={copyId}
                    className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy size={12} />
                    <span>ID da conta: {accountId}</span>
                  </button>
                </div>

                {/* Form + Avatar */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Fields */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Nome <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        disabled
                        className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Nome de exibição
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nome para exibição"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">
                        Telefone <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        disabled
                        className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Avatar Upload */}
                  <div className="lg:w-72">
                    <label className="text-xs text-muted-foreground">
                      Foto de perfil
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer p-8 min-h-[220px]"
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <Upload className="w-10 h-10 text-muted-foreground/40 mb-3" />
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="text-primary font-medium">
                          Clique para enviar
                        </span>{" "}
                        ou arraste até aqui
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Apenas arquivos png, jpeg, jpg e webp são aceitos
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        O tamanho máximo é 30MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-8 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            )}

            {activeTab === "antecipacao" && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h1 className="text-xl font-bold text-foreground mb-2">
                  Antecipação de valores
                </h1>
                <p className="text-sm text-muted-foreground">
                  Configurações de antecipação em breve.
                </p>
              </div>
            )}

            {activeTab === "seguranca" && <SecurityTab />}

            {activeTab === "taxas" && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h1 className="text-xl font-bold text-foreground mb-1">
                  Minhas taxas
                </h1>
                <p className="text-xs text-muted-foreground mb-6">
                  Taxas aplicadas nas suas transações
                </p>

                {feesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2
                      size={18}
                      className="animate-spin text-muted-foreground"
                    />
                  </div>
                ) : !sellerFee ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhuma taxa configurada ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sellerFee.name && (
                      <div className="flex items-center gap-2 px-1 pb-1 text-sm text-muted-foreground">
                        <span>Plano atual:</span>
                        <span className="font-semibold text-foreground">
                          {sellerFee.name}
                        </span>
                      </div>
                    )}
                    {(
                      [
                        {
                          label: "Pix",
                          fixed: sellerFee.pixFixedFee,
                          variable: sellerFee.pixVariableFee,
                          min: sellerFee.pixMinFee,
                        },
                        {
                          label: "Cartão de Crédito",
                          fixed: sellerFee.cardFixedFee,
                          variable: sellerFee.cardVariableFee,
                          min: sellerFee.cardMinFee,
                        },
                        {
                          label: "Boleto",
                          fixed: sellerFee.boletoFixedFee,
                          variable: sellerFee.boletoVariableFee,
                          min: sellerFee.boletoMinFee,
                        },
                        {
                          label: "Cripto",
                          fixed: sellerFee.cryptoFixedFee,
                          variable: sellerFee.cryptoVariableFee,
                          min: sellerFee.cryptoMinFee,
                        },
                        {
                          label: "Saque",
                          fixed: sellerFee.withdrawalFixedFee,
                          variable: sellerFee.withdrawalVariableFee,
                          min: sellerFee.withdrawalMinFee,
                        },
                      ] as const
                    ).map(({ label, fixed, variable, min }) => {
                      const hasAny = fixed > 0 || variable > 0 || min > 0;
                      if (!hasAny) return null;

                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30 border border-border/50"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {label}
                          </span>
                          <div className="flex items-center gap-5">
                            {variable > 0 && (
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground/60">
                                  Variável
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  {variable.toFixed(2).replace(".", ",")}%
                                </p>
                              </div>
                            )}
                            {fixed > 0 && (
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground/60">
                                  Fixa
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  R$ {fixed.toFixed(2).replace(".", ",")}
                                </p>
                              </div>
                            )}
                            {min > 0 && (
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground/60">
                                  Mínima
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  R$ {min.toFixed(2).replace(".", ",")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="mt-5 text-xs md:text-sm text-muted-foreground/60">
                  Taxas sujeitas a alteração. Entre em contato com o suporte
                  para negociar condições especiais.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
