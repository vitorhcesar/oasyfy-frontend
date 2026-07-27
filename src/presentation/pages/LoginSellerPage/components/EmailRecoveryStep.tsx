import { Input } from "@/presentation/components/Input";
import { Label } from "@/presentation/components/Label";
import { Button } from "@/presentation/components/ui/button";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowRight, Mail, X } from "lucide-react";
import { useState } from "react";
import z from "zod";

const emailSchema = z.string().email("Insira um email válido");

interface IEmailRecoveryStepProps {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
}

export default function EmailRecoveryStep({
  email,
  setEmail,
  loading,
  setLoading,
  onSuccess,
}: IEmailRecoveryStepProps) {
  const apiService = useApiService();

  const [error, setError] = useState("");

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setError("");

    const targetEmail = email.trim();

    const result = emailSchema.safeParse(targetEmail);

    if (!result.success) {
      setError("Insira um email válido");
      setLoading(false);
      return;
    }

    setLoading(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.account.sendPasswordRecoveryCode(targetEmail);
        setEmail(targetEmail);
        onSuccess();
      },
      {
        defaultErrorMessage: "Erro ao enviar código",
        defaultErrorTitle: "Erro ao enviar código",
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendCode(e);
  };

  return (
    <>
      <header className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
          <Mail className="text-primary" size={22} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Recuperar senha
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Informe seu email para receber um código de 6 dígitos
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive animate-fade-in">
            <X size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="auth-cta !mt-3 h-12 w-full rounded-xl text-base font-semibold"
          loading={loading}
          rippleColor="rgba(15, 6, 23, 0.2)"
        >
          Enviar código <ArrowRight size={17} />
        </Button>
      </form>
    </>
  );
}
