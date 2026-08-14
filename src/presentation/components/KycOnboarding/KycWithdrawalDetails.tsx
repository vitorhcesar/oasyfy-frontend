import { useApiService } from "@/presentation/hooks/use-api-service";
import ModalPortal from "@/presentation/components/ModalPortal";
import { Checkbox } from "@/presentation/components/ui/checkbox";
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
          Confira endereço e dados bancários. Os saques serão liberados com
          estas informações — confirme que estão corretas.
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
  const [bankConfirmed, setBankConfirmed] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const currentIndex = STEPS.indexOf(withdrawalStep);

  const handleNextStep = () => {
    try {
      validateKycWithdrawalStep({ form, step: withdrawalStep });
      if (withdrawalStep === "bank" && !bankConfirmed) {
        setError(
          "Confirme que os dados bancários estão corretos para continuar.",
        );
        return;
      }
      if (currentIndex < STEPS.length - 1) {
        setError("");
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
      setShowSubmitConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 animate-backdrop-enter bg-background/80 backdrop-blur-sm" />

        <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg animate-modal-enter">
          <div className="px-7 pb-4 pt-6">
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
                  <div
                    key={s}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
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
            {withdrawalStep === "bank" && (
              <div className="space-y-4">
                <BankStep />
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5">
                  <Checkbox
                    checked={bankConfirmed}
                    onCheckedChange={(checked) => {
                      setBankConfirmed(checked === true);
                      if (checked === true) setError("");
                    }}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-relaxed text-foreground">
                    Confirmo que os dados bancários estão corretos e que a conta
                    está no meu nome ou da minha empresa.
                  </span>
                </label>
              </div>
            )}
            {withdrawalStep === "review" && <WithdrawalReviewStep />}
            {error ? (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-7 py-4">
            <RippleButton
              onClick={handlePreviousStep}
              rippleColor="rgba(0,0,0,0.08)"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground active:scale-[0.97]"
            >
              <ArrowLeft size={15} /> {currentIndex > 0 ? "Voltar" : "Fechar"}
            </RippleButton>

            {withdrawalStep === "review" ? (
              <RippleButton
                onClick={() => {
                  if (!bankConfirmed) {
                    setError(
                      "Volte na etapa Banco e confirme que os dados estão corretos.",
                    );
                    return;
                  }
                  setShowSubmitConfirm(true);
                }}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 active:scale-[0.97]"
              >
                <CheckCircle2 size={15} />
                Confirmar e liberar saques
              </RippleButton>
            ) : (
              <RippleButton
                onClick={handleNextStep}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                Continuar <ArrowRight size={15} />
              </RippleButton>
            )}
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          onClick={() => !submitting && setShowSubmitConfirm(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-base font-semibold text-foreground">
              Tem certeza de que os dados estão corretos?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Endereço e conta bancária serão aprovados automaticamente. Os
              saques serão enviados para esta conta — revise com atenção.
            </p>
            <div className="mb-5 space-y-3">
              <div className="space-y-1 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Endereço
                </p>
                <p className="text-foreground">
                  {form.street}, {form.number}
                  {form.complement ? `, ${form.complement}` : ""}
                  <br />
                  {form.neighborhood} — {form.city}/{form.state}
                  <br />
                  CEP {form.zipCode}
                </p>
              </div>
              <div className="space-y-1.5 rounded-xl border border-border/50 bg-muted/30 px-3.5 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Banco
                </p>
                <p className="font-medium text-foreground">
                  {form.bank.bankName}
                </p>
                <p className="text-muted-foreground">
                  Ag. {form.bank.agency}
                  {form.bank.agencyDigit ? `-${form.bank.agencyDigit}` : ""} ·
                  Conta {form.bank.account}-{form.bank.accountDigit} (
                  {form.bank.accountType === "corrente"
                    ? "Corrente"
                    : "Poupança"}
                  )
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  PIX ({form.bank.pixKeyType?.toUpperCase()}): {form.bank.pixKey}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <RippleButton
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                rippleColor="rgba(0,0,0,0.08)"
                className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                Revisar
              </RippleButton>
              <RippleButton
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {submitting ? "Enviando..." : "Sim, estão corretos"}
              </RippleButton>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
}
