import { AppError } from "@/domain/errors/app.error";
import { Input } from "@/http/components/Input";
import { Label } from "@/http/components/Label";
import { PasswordChecks } from "@/http/components/PasswordChecks";
import { PasswordInput } from "@/http/components/PasswordInput";
import { Button } from "@/http/components/ui/button";
import { PasswordStrengthHelper } from "@/http/helper/password-strength.helper";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { translateError } from "@/http/utils/translate-error";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { phoneValidationSchema } from "@/http/validation/schemas/phone-validation.schema";
import { authClient } from "@/infra/auth";
import { apiService } from "@/infra/http";
import { ArrowRight, Check, Mail, Phone, User, X } from "lucide-react";
import { useState } from "react";
import z from "zod";

const passwordStrengthHelper = new PasswordStrengthHelper();

const emailValidationSchema = z.string().email("Insira um email válido");

interface ISignUpFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  openSignupVerification: () => Promise<void>;
  setView: (view: "login" | "signup") => void;
}

export default function SignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  openSignupVerification,
  setView,
}: ISignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const schema = z.object({
      email: emailValidationSchema,
      phone: phoneValidationSchema,
    });

    const result = schema.safeParse({ email, phone });
    if (!result.success) {
      setError(getErrorMessageOrDefault(result.error, "Dados inválidos"));
      return;
    }

    const passwordStrong =
      passwordStrengthHelper.checkPasswordIsStrong(password);

    if (!passwordStrong) {
      setError("Sua senha não atende todos os requisitos de segurança");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        const rl = await apiService.rateLimit.checkSignup();

        if (rl.data.allowed === false) {
          throw new AppError(
            rl.data.message || "Muitas tentativas. Tente novamente mais tarde.",
            429
          );
        }

        const signUpResult = await authClient.signUp.email({
          email,
          password,
          name: fullName,
        });

        if (signUpResult.error) {
          throw new AppError(
            translateError(
              signUpResult.error.message ?? "Erro desconhecido ao cadastrar"
            ),
            400
          );
        }

        await authClient.signOut();
        await openSignupVerification();
      },
      {
        defaultErrorMessage: "Erro ao cadastrar",
        defaultErrorTitle: "Erro ao cadastrar",
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleGoToLogin = () => {
    setView("login");
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setConfirmPassword("");
  };

  return (
    <>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-foreground">
          Crie sua conta
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha seus dados para começar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-destructive text-[13px] flex items-center gap-2">
            <X size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15 text-primary text-[13px] flex items-center gap-2">
            <Check size={14} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="João Silva"
            startComponent={
              <User size={16} className="text-muted-foreground/50" />
            }
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            startComponent={
              <Mail size={16} className="text-muted-foreground/50" />
            }
          />
          {email && !emailValidationSchema.safeParse(email).success && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1.5 pl-1">
              <X size={11} /> Email inválido
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="(11) 99999-9999"
            startComponent={
              <Phone size={16} className="text-muted-foreground/50" />
            }
          />
          {phone && !phoneValidationSchema.safeParse(phone).success && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1.5 pl-1">
              <X size={11} /> Telefone inválido
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
          />

          {password && <PasswordChecks password={password} />}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 !mt-3"
          loading={loading}
        >
          Criar conta <ArrowRight size={15} />
        </Button>
      </form>

      <div className="text-center mt-6">
        <button
          onClick={handleGoToLogin}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Já tem conta? <span className="text-primary font-medium">Entrar</span>
        </button>
      </div>
    </>
  );
}
