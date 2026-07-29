import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Landmark } from "lucide-react";
import { useState } from "react";
import { RippleButton } from "../ui/ripple-button";
import AddressStep from "./AddressStep";
import BankStep from "./BankStep";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import { KycOnboardingTypes } from "./types";
import { validateKycWithdrawalStep } from "./validators/validate-kyc-onboarding-step";

const STEPS: KycOnboardingTypes.TWithdrawalStep[] = [
  "address",
  "bank",
  "review",
];

const STEP_LABELS: Record<KycOnboardingTypes.TWithdrawalStep, string> = {
  address: "Endereço",
  bank: "Banco",
  review: "Revisão",
};

interface IKycWithdrawalDetailsProps {
  onComplete: () => void;
  onCancel?: () => void;
}

function WithdrawalReviewStep() {
  const { form, setWithdrawalStep } = useKycOnboardingStore();

  return (
    <div className="space-y-4 animate-step-slide">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10 mb-2">
        <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Confira endereço e dados bancários. Após a aprovação, os saques serão
          liberados.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setWithdrawalStep("address")}
        className="w-full text-left rounded-xl border border-border/60 p-4 space-y-2.5 bg-card hover:border-primary/30 transition-all"
      >
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Endereço
        </h4>
        <p className="text-sm text-foreground leading-relaxed">
          {form.street}, {form.number}
          {form.complement ? `, ${form.complement}` : ""}
          <br />
          {form.neighborhood} — {form.city}/{form.state}
          <br />
          CEP {form.zipCode}
        </p>
      </button>

      <button
        type="button"
        onClick={() => setWithdrawalStep("bank")}
        className="w-full text-left rounded-xl border border-border/60 p-4 space-y-2.5 bg-card hover:border-primary/30 transition-all"
      >
        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
          Dados Bancários
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Banco</span>
            <p className="font-medium text-foreground">{form.bank.bankName}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Agência</span>
            <p className="font-medium text-foreground">
              {form.bank.agency}
              {form.bank.agencyDigit ? `-${form.bank.agencyDigit}` : ""}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Conta</span>
            <p className="font-medium text-foreground">
              {form.bank.account}-{form.bank.accountDigit} (
              {form.bank.accountType === "corrente" ? "Corrente" : "Poupança"})
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">
              Chave PIX ({form.bank.pixKeyType?.toUpperCase()})
            </span>
            <p className="font-medium text-foreground truncate">
              {form.bank.pixKey}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function KycWithdrawalDetails({
  onComplete,
  onCancel,
}: IKycWithdrawalDetailsProps) {
  const apiService = useApiService();
  const { form, error, setError, withdrawalStep, setWithdrawalStep } =
    useKycOnboardingStore();
  const [submitting, setSubmitting] = useState(false);

  const currentIndex = STEPS.indexOf(withdrawalStep);

  const handleNextStep = () => {
    try {
      validateKycWithdrawalStep({ form, step: withdrawalStep });
      if (currentIndex < STEPS.length - 1) {
        setWithdrawalStep(STEPS[currentIndex + 1]);
      }
    } catch (err) {
      setError(getErrorMessageOrDefault(err, "Erro ao validar o formulário"));
    }
  };

  const handlePreviousStep = () => {
    if (currentIndex > 0) {
      setWithdrawalStep(STEPS[currentIndex - 1]);
      return;
    }
    onCancel?.();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      validateKycWithdrawalStep({ form, step: "address" });
      validateKycWithdrawalStep({ form, step: "bank" });

      await apiService.modules.kycSubmission.submitWithdrawalDetails({
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        bank: form.bank,
      });
      onComplete();
    } catch (err) {
      setError(
        getErrorMessageOrDefault(err, "Erro ao enviar dados para saque"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-backdrop-enter" />

      <div className="relative w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-lg overflow-hidden animate-modal-enter max-h-[90vh] flex flex-col">
        <div className="px-7 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Landmark className="text-primary" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Liberar saques
              </h2>
              <p className="text-xs text-muted-foreground">
                Informe endereço e dados bancários para sacar
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1">
            {STEPS.map((s, i) => {
              const isActive = i === currentIndex;
              const isDone = i < currentIndex;
              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`h-1 w-full rounded-full transition-all duration-500 ${
                      isDone
                        ? "bg-primary"
                        : isActive
                          ? "bg-primary/50"
                          : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isDone
                        ? "text-primary"
                        : isActive
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-4">
          {withdrawalStep === "address" && <AddressStep />}
          {withdrawalStep === "bank" && <BankStep />}
          {withdrawalStep === "review" && <WithdrawalReviewStep />}
          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="px-7 py-4 border-t border-border/60 flex items-center justify-between">
          <RippleButton
            onClick={handlePreviousStep}
            rippleColor="rgba(0,0,0,0.08)"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-[0.97]"
          >
            <ArrowLeft size={15} /> {currentIndex > 0 ? "Voltar" : "Fechar"}
          </RippleButton>

          {withdrawalStep === "review" ? (
            <RippleButton
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.97]"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {submitting ? "Enviando..." : "Enviar para Análise"}
            </RippleButton>
          ) : (
            <RippleButton
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.97]"
            >
              Continuar <ArrowRight size={15} />
            </RippleButton>
          )}
        </div>
      </div>
    </div>
  );
}
