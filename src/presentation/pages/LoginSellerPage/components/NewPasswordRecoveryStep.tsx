import { AppError } from "@/domain/errors/app.error";
import { Label } from "@/presentation/components/Label";
import { OtpInput } from "@/presentation/components/OtpInput";
import { PasswordChecks } from "@/presentation/components/PasswordChecks";
import { PasswordInput } from "@/presentation/components/PasswordInput";
import { Button } from "@/presentation/components/ui/button";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { toast } from "@/presentation/hooks/use-toast";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import { useState } from "react";

interface INewPasswordRecoveryStepProps {
  email: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
}

export default function NewPasswordRecoveryStep({
  email,
  loading,
  setLoading,
  onSuccess,
}: INewPasswordRecoveryStepProps) {
  const apiService = useApiService();

  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordIsStrong, setPasswordIsStrong] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      throw new AppError("Insira o código completo", 400);
    }
    if (!passwordIsStrong) {
      throw new AppError("A senha não atende os requisitos", 400);
    }
    if (password !== confirmPassword) {
      throw new AppError("As senhas não coincidem", 400);
    }

    await apiService.modules.account.verifyPasswordRecovery({
      email,
      code: otpCode,
      new_password: password,
    });

    toast({
      title: "Senha atualizada com sucesso!",
      description: "Você pode fazer login com sua nova senha",
    });

    onSuccess();
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
        defaultErrorMessage: "Erro ao atualizar senha",
        defaultErrorTitle: "Erro ao atualizar senha",
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <>
      <header className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
          <Lock className="text-primary" size={22} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Nova senha
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Escolha uma nova senha segura para sua conta
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive animate-fade-in">
            <X size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-3 text-sm text-primary animate-fade-in">
            <Check size={15} className="mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <Label>Código de 6 dígitos</Label>
          <OtpInput
            value={otpCode}
            onChange={setOtpCode}
            disabled={loading}
            className={cn("size-[40px] sm:size-[58px]")}
          />
        </div>

        <div>
          <Label htmlFor="new-password">Nova senha</Label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
            className="auth-field h-12 rounded-xl text-base"
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
            className="auth-field h-12 rounded-xl text-base"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="auth-cta !mt-3 h-12 w-full rounded-xl text-base font-semibold"
          loading={loading}
          rippleColor="rgba(15, 6, 23, 0.2)"
        >
          Atualizar senha <ArrowRight size={17} />
        </Button>
      </form>
    </>
  );
}
