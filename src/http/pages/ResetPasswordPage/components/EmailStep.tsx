import { Input } from "@/http/components/Input";
import { Label } from "@/http/components/Label";
import { Button } from "@/http/components/ui/button";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { apiService } from "@/infra/http";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useResetPasswordPageStore } from "../stores/reset-password-page.store";

const emailSchema = z.string().email("Insira um e-mail válido");

export default function EmailStep() {
  const navigate = useNavigate();

  const { email, setEmail, loading, setLoading, setStep } =
    useResetPasswordPageStore();

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!emailSchema.safeParse(email).success) {
      setError("Insira um e-mail válido");
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        await apiService.account.sendPasswordRecoveryCode(email.trim());
        setStep("new-password");
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao enviar código",
            description: getErrorMessageOrDefault(
              error,
              "Erro ao enviar código"
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
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 lg:hidden text-center">
          <span className="text-xl font-bold text-foreground">Oasyfy</span>
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
            <Label htmlFor="email">E-mail da conta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="E-mail da conta"
              startComponent={
                <Mail size={16} className="text-muted-foreground/50" />
              }
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full !mt-4"
            loading={loading}
          >
            Enviar código <ArrowRight size={16} />
          </Button>
        </form>

        <div className="text-center mt-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate("/login/seller")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            ← Voltar ao login
          </Button>
        </div>
      </div>
    </div>
  );
}
