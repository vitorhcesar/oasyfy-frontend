import { OtpInput } from "@/http/components/OtpInput";
import { Button } from "@/http/components/ui/button";
import { cn } from "@/http/utils/cn";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { apiService } from "@/infra/http";
import { ArrowRight, KeyRound, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const emailSchema = z.string().email("Insira um email válido");

interface ICodeRecoveryStepProps {
  email: string;
  otpCode: string;
  setOtpCode: (otpCode: string) => void;
  onSuccess: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function CodeRecoveryStep({
  email,
  otpCode,
  setOtpCode,
  onSuccess,
  loading,
  setLoading,
}: ICodeRecoveryStepProps) {
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

    tryOrToastError(
      async () => {
        await apiService.account.sendPasswordRecoveryCode(targetEmail);
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

  return (
    <>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <KeyRound className="text-primary" size={22} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Insira o código
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (otpCode.length === 6) onSuccess();
          else setError("Insira o código completo");
        }}
        className="space-y-6"
      >
        {error && (
          <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <X size={10} />
            </div>
            <span>{error}</span>
          </div>
        )}

        <OtpInput
          value={otpCode}
          onChange={setOtpCode}
          onPasteFullfilled={onSuccess}
          disabled={loading}
          className={cn("size-[37px] sm:size-[55px]")}
        />

        <Button
          type="submit"
          disabled={otpCode.length !== 6 || loading}
          className="w-full py-[25px]"
          loading={loading}
        >
          Continuar <ArrowRight size={16} />
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleSendCode}
            className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
          >
            Reenviar código
          </button>
        </div>
      </form>
    </>
  );
}
