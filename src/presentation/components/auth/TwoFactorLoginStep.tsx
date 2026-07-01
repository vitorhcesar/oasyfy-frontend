import { authClient } from "@/infra/auth/auth-client";
import { Button } from "@/presentation/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ITwoFactorLoginStepProps {
  onVerified: () => Promise<void>;
  onCancel?: () => void;
}

export function TwoFactorLoginStep({
  onVerified,
  onCancel,
}: ITwoFactorLoginStepProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: true,
      });

      if (error) {
        toast.error("Código inválido");
        setLoading(false);
        return;
      }

      // Garante que o cliente Better Auth sincronize a sessão criada após o TOTP
      // antes do callback de conclusão do login (gate de papel / redirect).
      await authClient.getSession();

      await onVerified();
    } catch {
      toast.error("Erro ao verificar 2FA");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Verificação em duas etapas
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Digite o código de 6 dígitos do seu autenticador.
        </p>
      </div>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        maxLength={6}
        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/40 text-center text-lg font-mono tracking-[0.4em] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all duration-300"
      />

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Voltar
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1"
          disabled={loading || code.length !== 6}
          loading={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Verificar"}
        </Button>
      </div>
    </form>
  );
}
