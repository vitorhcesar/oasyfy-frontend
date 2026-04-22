import { supabase } from "@/infrastructure/integrations/supabase/client";
import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
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

type TwoFAStatus = "loading" | "disabled" | "verifying" | "enabled";

export default function Admin2FA() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<TwoFAStatus>("loading");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [factorId, setFactorId] = useState("");

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus("loading");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setStatus("disabled");
      return;
    }
    const totpFactor = data.totp.find((f) => f.status === "verified");
    if (totpFactor) {
      setFactorId(totpFactor.id);
      setStatus("enabled");
    } else setStatus("disabled");
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp) {
        for (const f of factors.totp.filter((f) => f.status !== "verified")) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Admin 2FA",
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      setQrUri(data.totp.uri);
      setSecret(data.totp.secret);
      setFactorId(data.id);
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
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        toast.error(challenge.error.message);
        setLoading(false);
        return;
      }
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) {
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
    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        toast.error(error.message);
        setDisabling(false);
        return;
      }
      toast.success("2FA desativado");
      setFactorId("");
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
        qrUri
      )}`
    : "";

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-[0.2em] mb-2">
            Segurança
          </p>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Autenticação de dois fatores
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Proteja sua conta admin com verificação via Google Authenticator
          </p>
        </div>

        {status === "loading" && (
          <div className="flex justify-center py-24">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "disabled" && (
          <div className="animate-fade-in space-y-5">
            <div className="rounded-xl border border-border/40 bg-card p-5">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/8 flex items-center justify-center shrink-0 border border-amber-500/10">
                  <AlertTriangle size={16} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-foreground">
                    2FA não ativado
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Como administrador, é altamente recomendado ativar o 2FA.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/30 p-5">
              <p className="text-xs md:text-sm font-medium text-foreground mb-3.5">
                Como funciona?
              </p>
              <div className="space-y-3">
                {[
                  "Instale o Google Authenticator no seu celular",
                  "Escaneie o QR Code que será gerado",
                  "Digite o código de 6 dígitos para confirmar",
                  "A cada login, o código será exigido",
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-primary/8 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 border border-primary/10">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleEnroll}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
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
            <div className="rounded-xl border border-border/40 bg-card p-5">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/10">
                  <Smartphone size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-foreground">
                    Configurar autenticador
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Escaneie o QR Code ou insira a chave manualmente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative p-3 bg-background rounded-xl border border-border/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)] ring-1 ring-primary/10">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 pointer-events-none" />
                <img
                  src={qrImageUrl}
                  alt="QR Code 2FA"
                  className="relative w-44 h-44 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5 block">
                Chave manual
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/30 text-xs md:text-sm font-mono text-foreground select-all break-all leading-relaxed">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-2 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors duration-200"
                >
                  <Copy size={13} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-1.5 block">
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
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/40 text-center text-lg font-mono tracking-[0.4em] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all duration-300"
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
                className="flex-1 py-2.5 rounded-xl border border-border/40 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || verifyCode.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
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
            <div className="rounded-xl border border-border/40 bg-card p-5">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 border border-primary/10">
                  <CheckCircle2 size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-[13px] font-medium text-foreground">
                    2FA ativado
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Sua conta está protegida com autenticação de dois fatores.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-4 flex items-start gap-3">
              <ShieldCheck size={15} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                A cada login no painel admin, será solicitado o código do Google
                Authenticator para verificar sua identidade.
              </p>
            </div>

            <button
              onClick={handleDisable}
              disabled={disabling}
              className="w-full py-2.5 rounded-xl border border-destructive/20 text-destructive text-[13px] font-medium hover:bg-destructive/5 transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
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
      </div>
    </AdminLayout>
  );
}
