import { AppError } from "@/domain/errors/app.error";
import { authClient } from "@/infra/auth";
import { savePendingVerification } from "../seller-login-verification-storage";
import { Input } from "@/presentation/components/Input";
import { Label } from "@/presentation/components/Label";
import { PasswordChecks } from "@/presentation/components/PasswordChecks";
import { PasswordInput } from "@/presentation/components/PasswordInput";
import { Button } from "@/presentation/components/ui/button";
import { Checkbox } from "@/presentation/components/ui/checkbox";
import { PasswordStrengthHelper } from "@/presentation/helper/password-strength.helper";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { translateError } from "@/presentation/utils/translate-error";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { phoneValidationSchema } from "@/presentation/validation/schemas/phone-validation.schema";
import { ArrowRight, Mail, Phone, User, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import z from "zod";

const passwordStrengthHelper = new PasswordStrengthHelper();

const emailValidationSchema = z.string().email("Insira um email válido");

interface ISignUpFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  setView: (view: "login" | "signup") => void;
  onSuccess: () => Promise<void>;
}

export default function SignUpForm({
  email,
  setEmail,
  password,
  setPassword,
  setView,
  onSuccess,
}: ISignUpFormProps) {
  const apiService = useApiService();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!acceptedTerms) {
      setError("Aceite os termos para criar sua conta");
      return;
    }

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
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        const rl = await apiService.modules.rateLimit.checkSignup();

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
              signUpResult.error.message ||
                signUpResult.error.code ||
                "Erro desconhecido ao cadastrar"
            ),
            400
          );
        }

        await apiService.modules.user.setUserToSeller(
          Number(signUpResult.data.user.id)
        );

        // Persiste o e-mail antes do signOut para que o FormPanel, ao remontar
        // pelo PublicRoute (isLoading=true), já leia o sessionStorage e exiba
        // o formulário de código diretamente.
        savePendingVerification(email);
        await authClient.signOut();
        await onSuccess();
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
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setConfirmPassword("");
    setAcceptedTerms(false);
  };

  return (
    <>
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Crie sua conta
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Preencha seus dados para começar
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
            <X size={15} className="flex-shrink-0" />
            <span>{error}</span>
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
            className="auth-field h-12 rounded-xl text-base"
            startComponent={
              <User size={17} className="text-muted-foreground/50" />
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
            className="auth-field h-12 rounded-xl text-base"
            startComponent={
              <Mail size={17} className="text-muted-foreground/50" />
            }
          />
          {email && !emailValidationSchema.safeParse(email).success && (
            <p className="mt-1.5 flex items-center gap-1 pl-1 text-sm text-destructive">
              <X size={12} /> Email inválido
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
            className="auth-field h-12 rounded-xl text-base"
            startComponent={
              <Phone size={17} className="text-muted-foreground/50" />
            }
          />
          {phone && !phoneValidationSchema.safeParse(phone).success && (
            <p className="mt-1.5 flex items-center gap-1 pl-1 text-sm text-destructive">
              <X size={12} /> Telefone inválido
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
            className="auth-field h-12 rounded-xl text-base"
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
            className="auth-field h-12 rounded-xl text-base"
          />
        </div>

        <label
          htmlFor="signup-terms"
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
        >
          <Checkbox
            id="signup-terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-muted-foreground">
            Aceitar os{" "}
            <Link
              to="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              termos de uso
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading || !acceptedTerms}
          className="auth-cta !mt-3 h-12 w-full rounded-xl text-base font-semibold"
          loading={loading}
          rippleColor="rgba(15, 15, 16, 0.2)"
        >
          Criar conta <ArrowRight size={16} />
        </Button>
      </form>

      <div className="mt-7 text-center">
        <button
          onClick={handleGoToLogin}
          className="text-base text-muted-foreground transition-colors hover:text-foreground"
        >
          Já tem conta?{" "}
          <span className="font-semibold text-primary">Entrar</span>
        </button>
      </div>
    </>
  );
}
