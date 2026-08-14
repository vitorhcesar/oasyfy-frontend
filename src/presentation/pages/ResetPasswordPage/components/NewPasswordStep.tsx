import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { Label } from "@/presentation/components/Label";
import { OtpInput } from "@/presentation/components/OtpInput";
import { PasswordChecks } from "@/presentation/components/PasswordChecks";
import { PasswordInput } from "@/presentation/components/PasswordInput";
import { Button } from "@/presentation/components/ui/button";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowRight, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useResetPasswordPageStore } from "../stores/reset-password-page.store";

const emailSchema = z.string().email("Insira um e-mail válido");
const codeRegex = z
  .string()
  .regex(/^\d{6}$/, "Informe o código de 6 dígitos enviado ao e-mail");

export default function NewPasswordStep() {
  const navigate = useNavigate();

  const apiService = useApiService();

  const {
    email,
    code,
    setCode,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordIsStrong,
    setPasswordIsStrong,
    loading,
    setLoading,
    setSuccess,
  } = useResetPasswordPageStore();

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!emailSchema.safeParse(email).success) {
      setError("Insira um e-mail válido");
      return;
    }

    if (!codeRegex.safeParse(code.trim()).success) {
      setError("Informe o código de 6 dígitos enviado ao e-mail");
      return;
    }

    if (!passwordIsStrong) {
      setError("A senha não atende os requisitos");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        await apiService.modules.account.verifyPasswordRecovery({
          email: email.trim(),
          code: code.trim(),
          new_password: password,
        });
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2500);
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
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 lg:hidden">
          <AuthBrandMark size="md" variant="black" />
        </div>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="text-primary" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Confirme e-mail, código e nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="code">Código de 6 dígitos</Label>
            <OtpInput value={code} onChange={setCode} length={6} />
          </div>

          <div className="space-y-2">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Nova senha"
              />
            </div>

            {password && (
              <PasswordChecks
                password={password}
                onChangePasswordIsStrong={setPasswordIsStrong}
              />
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirmar nova senha"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full !mt-4"
            loading={loading}
          >
            Atualizar senha <ArrowRight size={16} />
          </Button>
        </form>

        <div className="text-center mt-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            ← Voltar ao login
          </Button>
        </div>
      </div>
    </div>
  );
}
