import { Label } from "@/http/components/Label";
import { PasswordChecks } from "@/http/components/PasswordChecks";
import { PasswordInput } from "@/http/components/PasswordInput";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { httpClient, IApiEnvelope } from "@/infra/http";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import { useState } from "react";

interface INewPasswordRecoveryStepProps {
  email: string;
  otpDigits: string[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  resetRecoveryState: () => void;
}

export default function NewPasswordRecoveryStep({
  email,
  otpDigits,
  loading,
  setLoading,
  resetRecoveryState,
}: INewPasswordRecoveryStepProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsStrong, setPasswordIsStrong] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const code = otpDigits.join("");

    if (code.length !== 6) {
      setError("Insira o código completo");
      setLoading(false);
      return;
    }
    if (!passwordIsStrong) {
      setError("A senha não atende os requisitos");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      await httpClient.post<IApiEnvelope<{ success?: boolean }>>(
        "/api/v1/account/password-recovery/verify",
        {
          email,
          code,
          new_password: password,
        }
      );
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof (err.response.data as { message: unknown }).message === "string"
          ? (err.response.data as { message: string }).message
          : "Erro ao verificar código";
      setError(msg);
      setLoading(false);
      return;
    }

    setSuccess("Senha atualizada com sucesso! Redirecionando...");
    setLoading(false);
    setTimeout(() => {
      resetRecoveryState();
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    setLoading(true);

    tryOrToastError(
      async () => {
        await handleVerifyAndReset(e);
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao atualizar senha",
            description: getErrorMessageOrDefault(
              error,
              "Erro ao atualizar senha"
            ),
          };
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="text-primary" size={22} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Nova senha
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Escolha uma nova senha segura para sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <X size={10} />
            </div>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check size={10} />
            </div>
            <span>{success}</span>
          </div>
        )}

        <div>
          <Label htmlFor="new-password">Nova senha</Label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
          />

          {password && (
            <PasswordChecks
              password={password}
              onChangePasswordIsStrong={setPasswordIsStrong}
            />
          )}
        </div>

        <div>
          <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
          <PasswordInput
            id="confirm-new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Atualizar senha <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
