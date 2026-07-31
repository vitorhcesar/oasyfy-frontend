import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/infra/auth/auth-client";
import { parseSecretFromTotpUri } from "@/infra/auth/two-factor-utils";
import PageHeader from "@/presentation/components/PageHeader";

type TTwoFAStatus = "loading" | "disabled" | "verifying" | "enabled";

interface ITwoFactorSettingsPanelProps {
  issuer: string;
  description: string;
  disabledDescription: string;
  enabledDescription: string;
}

export function TwoFactorSettingsPanel({
  issuer,
  description,
  disabledDescription,
  enabledDescription,
}: ITwoFactorSettingsPanelProps) {
  const [status, setStatus] = useState<TTwoFAStatus>("loading");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"enable" | "disable">(
    "enable",
  );

  useEffect(() => {
    void checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus("loading");
    const session = await authClient.getSession();
    if (session.data?.user?.twoFactorEnabled) {
      setStatus("enabled");
    } else {
      setStatus("disabled");
    }
  };

  const openPasswordModal = (action: "enable" | "disable") => {
    setPasswordAction(action);
    setPassword("");
    setShowPasswordModal(true);
  };

  const handleEnable = async () => {
    if (!password) {
      toast.error("Digite sua senha");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        issuer,
      });

      if (error || !data?.totpURI) {
        toast.error(error?.message || "Erro ao configurar 2FA");
        setLoading(false);
        return;
      }

      setQrUri(data.totpURI);
      setSecret(parseSecretFromTotpUri(data.totpURI));
      setShowPasswordModal(false);
      setPassword("");
      setStatus("verifying");
    } catch {
      toast.error("Erro ao configurar 2FA");
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
      });

      if (error) {
        toast.error("Código inválido. Tente novamente.");
        setLoading(false);
        return;
      }

      toast.success("2FA ativado com sucesso!");
      setStatus("enabled");
      setQrUri("");
      setSecret("");
      setVerifyCode("");
    } catch {
      toast.error("Erro ao verificar código");
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!password) {
      toast.error("Digite sua senha");
      return;
    }

    setDisabling(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        toast.error(error.message || "Erro ao desativar 2FA");
        setDisabling(false);
        return;
      }

      toast.success("2FA desativado");
      setShowPasswordModal(false);
      setPassword("");
      setStatus("disabled");
    } catch {
      toast.error("Erro ao desativar 2FA");
    }
    setDisabling(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Chave copiada");
  };

  const qrImageUrl = qrUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        qrUri,
      )}`
    : "";

  return (
    <>
      <PageHeader
        eyebrow="Segurança"
        title="Autenticação de dois fatores"
        description={description}
      />

      {status === "loading" && (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {status === "disabled" && (
        <div className="animate-fade-in space-y-5">
          <div className="admin-surface p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10">
                <AlertTriangle size={16} className="text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  2FA não ativado
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                  {disabledDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="admin-surface p-5">
            <p className="mb-3.5 text-xs font-medium text-foreground md:text-sm">
              Como funciona?
            </p>
            <div className="space-y-3">
              {[
                "Instale o Google Authenticator no seu celular",
                "Escaneie o QR Code que será gerado",
                "Digite o código de 6 dígitos para confirmar",
                "Pronto! Sua conta estará protegida",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-primary/10 bg-primary/8 text-xs font-semibold text-primary md:text-xs">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => openPasswordModal("enable")}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldCheck size={14} />
            )}
            Ativar 2FA
          </button>
        </div>
      )}

      {status === "verifying" && (
        <div className="animate-fade-in space-y-5">
          <div className="admin-surface p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/8">
                <Smartphone size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Configurar autenticador
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                  Escaneie o QR Code ou insira a chave manualmente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="admin-surface relative p-3">
              <img
                src={qrImageUrl}
                alt="QR Code 2FA"
                className="relative h-44 w-44 rounded-lg"
              />
            </div>
          </div>

          {secret && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Chave manual
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 select-all break-all rounded-lg border border-border/30 bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed text-foreground md:text-sm">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="rounded-lg border border-border/30 p-2 transition-colors duration-200 hover:bg-muted/30"
                >
                  <Copy size={13} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Código de verificação
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) =>
                setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl border border-border/40 bg-background px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-foreground placeholder:text-muted-foreground/20 transition-all duration-300 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setStatus("disabled");
                setQrUri("");
                setSecret("");
                setVerifyCode("");
              }}
              className="flex-1 rounded-xl border border-border/40 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/20 hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Verificar e ativar
            </button>
          </div>
        </div>
      )}

      {status === "enabled" && (
        <div className="animate-fade-in space-y-5">
          <div className="admin-surface p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/10">
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  2FA ativado
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                  {enabledDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="admin-surface flex items-start gap-3 border-primary/15 p-4">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              A cada login, será solicitado o código do Google Authenticator para
              verificar sua identidade.
            </p>
          </div>

          <button
            onClick={() => openPasswordModal("disable")}
            disabled={disabling}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/5 disabled:opacity-40"
          >
            {disabling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            Desativar 2FA
          </button>
        </div>
      )}

      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="admin-surface w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-base font-semibold text-foreground">
              {passwordAction === "enable" ? "Confirmar senha" : "Desativar 2FA"}
            </h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="mb-4 w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/40 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={
                  passwordAction === "enable" ? handleEnable : handleDisable
                }
                disabled={loading || disabling || !password}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                {passwordAction === "enable" ? "Continuar" : "Desativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
