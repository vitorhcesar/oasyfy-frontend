import { Input } from "@/http/components/Input";
import { Label } from "@/http/components/Label";
import { toast } from "@/http/hooks/use-toast";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { httpClient, IApiEnvelope } from "@/infra/http";
import { ArrowRight, Check, Mail, X } from "lucide-react";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setError("");
    setSuccess("");

    const targetEmail = email.trim();

    const result = emailSchema.safeParse(targetEmail);

    if (!result.success) {
      setError("Insira um email válido");
      setLoading(false);
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        await httpClient.post<IApiEnvelope<unknown>>(
          "/api/v1/account/password-recovery/send",
          {
            email: targetEmail,
          }
        );
        setEmail(targetEmail);
        onSuccess();
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao enviar código",
            description: getErrorMessageOrDefault(
              error,
              "Tente novamente mais tarde"
            ),
          };
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    setLoading(true);

    try {
      await handleSendCode(e);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao enviar código",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="text-primary" size={22} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Recuperar senha
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Informe seu email para receber um código de 6 dígitos
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
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
              Enviar código <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
