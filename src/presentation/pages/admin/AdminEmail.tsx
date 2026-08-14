import { authClient } from "@/infra/auth/auth-client";
import PageHeader from "@/presentation/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import useAdminSmtpSettingsQuery from "@/presentation/hooks/use-admin-smtp-settings-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Send,
  Server,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SmtpSettings {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  has_password?: boolean;
  from_email: string;
  from_name: string;
  encryption: string;
  is_active: boolean;
}

const defaultSettings: SmtpSettings = {
  host: "",
  port: 587,
  username: "",
  password: "",
  from_email: "",
  from_name: "",
  encryption: "tls",
  is_active: true,
};

export default function AdminEmail() {
  const apiService = useApiService();
  const { data: smtpData, isLoading, invalidateQuery } =
    useAdminSmtpSettingsQuery();
  const [settings, setSettings] = useState<SmtpSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearMfaCode, setClearMfaCode] = useState("");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!smtpData) return;
    const next = smtpData as unknown as SmtpSettings;
    setSettings({ ...next, password: "", is_active: true });
    setShowPassword(false);
    setIsMasked(
      Boolean(
        next.id || next.host || next.from_email || next.has_password,
      ),
    );
  }, [smtpData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        host: settings.host,
        port: settings.port,
        username: settings.from_email,
        password: settings.password,
        from_email: settings.from_email,
        from_name: settings.from_name,
        encryption: settings.encryption,
        is_active: true,
      };
      const saved = await apiService.modules.adminConfig.updateSmtpSettings(payload);
      setSettings({
        ...(saved as unknown as SmtpSettings),
        password: "",
      });
      toast.success("Configurações SMTP salvas com sucesso");
      setIsMasked(true);
      setShowPassword(false);
      await invalidateQuery();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Insira um e-mail para teste");
      return;
    }
    setTesting(true);
    try {
      await apiService.modules.email.testConnection(testEmail);
      toast.success("E-mail de teste enviado!");
      setTestDialogOpen(false);
      setTestEmail("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar e-mail de teste",
      );
    }
    setTesting(false);
  };

  const handleClearCredentials = async () => {
    if (clearMfaCode.length !== 6) {
      toast.error("Digite o código 2FA de 6 dígitos");
      return;
    }
    setClearing(true);
    try {
      const session = await authClient.getSession();
      if (!session.data?.user?.twoFactorEnabled) {
        toast.error("Você precisa ter 2FA ativado para limpar credenciais");
        setClearing(false);
        return;
      }

      const { error } = await authClient.twoFactor.verifyTotp({
        code: clearMfaCode,
      });
      if (error) {
        toast.error("Código 2FA inválido");
        setClearMfaCode("");
        setClearing(false);
        return;
      }

      await apiService.modules.adminConfig.deleteSmtpSettings();
      setClearDialogOpen(false);
      setClearMfaCode("");
      setShowPassword(false);
      toast.success("Credenciais SMTP removidas com sucesso");
      await invalidateQuery();
    } catch (err: any) {
      toast.error(err.message || "Erro ao limpar credenciais");
    }
    setClearing(false);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-2xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Comunicação"
          title="E-mail"
          description="Configure o servidor SMTP para disparo de e-mails."
        />

        {/* Status badge */}
        <div className="mb-6">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold",
              settings.is_active
                ? "border-success/25 bg-success/10 text-success"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {settings.is_active ? (
              <CheckCircle2 size={12} />
            ) : (
              <XCircle size={12} />
            )}
            {settings.is_active ? "SMTP ativo" : "SMTP inativo"}
          </div>
        </div>

        <div className="space-y-6">
          {/* SMTP Config */}
          <div className="admin-surface p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Server size={16} className="text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  Configuração SMTP
                </h2>
              </div>
              {isMasked && (
                <button
                  onClick={() => setIsMasked(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  <Eye size={12} />
                  Editar credenciais
                </button>
              )}
            </div>

            {isMasked ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Host SMTP
                  </label>
                  <div
                    className={cn(
                      inputClass,
                      "flex items-center text-muted-foreground/60 select-none",
                    )}
                  >
                    {settings.host
                      ? settings.host.replace(/^(.{4}).*(.{4})$/, "$1••••$2")
                      : "••••••••"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Porta
                  </label>
                  <div
                    className={cn(
                      inputClass,
                      "flex items-center text-muted-foreground/60 select-none",
                    )}
                  >
                    {settings.port}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    E-mail
                  </label>
                  <div
                    className={cn(
                      inputClass,
                      "flex items-center text-muted-foreground/60 select-none",
                    )}
                  >
                    {settings.from_email
                      ? settings.from_email.replace(
                          /^(.{2}).*(@.*)$/,
                          "$1••••$2",
                        )
                      : "••••••••"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Senha
                  </label>
                  <div
                    className={cn(
                      inputClass,
                      "flex items-center text-muted-foreground/60 select-none",
                    )}
                  >
                    ••••••••••••
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Host SMTP
                  </label>
                  <input
                    value={settings.host}
                    onChange={(e) =>
                      setSettings({ ...settings, host: e.target.value })
                    }
                    className={inputClass}
                    placeholder="smtp.seuservidor.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Porta
                  </label>
                  <input
                    type="number"
                    value={settings.port}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        port: parseInt(e.target.value) || 587,
                      })
                    }
                    className={inputClass}
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                    />
                    <input
                      type="email"
                      value={settings.from_email}
                      onChange={(e) =>
                        setSettings({ ...settings, from_email: e.target.value })
                      }
                      className={cn(inputClass, "pl-10")}
                      placeholder="noreply@suaempresa.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={settings.password}
                      onChange={(e) =>
                        setSettings({ ...settings, password: e.target.value })
                      }
                      autoComplete="new-password"
                      className={cn(inputClass, "pr-11")}
                      placeholder={
                        settings.has_password || settings.id
                          ? "Deixe em branco para manter"
                          : "••••••••"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {settings.id && (
              <button
                onClick={() => setClearDialogOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/5 transition-all duration-200 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Limpar credenciais
              </button>
            )}
            <div className="flex-1" />

            <button
              onClick={() => setTestDialogOpen(true)}
              disabled={!settings.host || !settings.from_email}
              className="px-4 py-2.5 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
            >
              <Send size={14} />
              Testar conexão
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all duration-200 disabled:opacity-40 flex items-center gap-2 shadow-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Testar conexão SMTP
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                E-mail de destino
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                />
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className={cn(inputClass, "pl-10")}
                  placeholder="teste@email.com"
                />
              </div>
              <p className="text-sm text-muted-foreground/60 mt-1.5">
                Um e-mail padrão de teste será enviado para este endereço.
              </p>
            </div>
            <button
              onClick={handleTestEmail}
              disabled={testing || !testEmail}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {testing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {testing ? "Enviando..." : "Enviar e-mail de teste"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Credentials Dialog with 2FA */}
      <Dialog
        open={clearDialogOpen}
        onOpenChange={(open) => {
          setClearDialogOpen(open);
          if (!open) setClearMfaCode("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck size={18} className="text-destructive" />
              Limpar credenciais SMTP
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Esta ação removerá todas as configurações SMTP. Para confirmar,
              digite o código 2FA do seu autenticador.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5 block">
                Código 2FA
              </label>
              <input
                type="text"
                value={clearMfaCode}
                onChange={(e) =>
                  setClearMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-center text-xl font-mono tracking-[0.4em] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive/40 transition-all duration-200"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setClearDialogOpen(false);
                  setClearMfaCode("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearCredentials}
                disabled={clearing || clearMfaCode.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:brightness-110 transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {clearing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Confirmar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
