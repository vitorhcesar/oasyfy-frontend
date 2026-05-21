import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { RippleButton } from "../ui/ripple-button";
import { KycOnboardingTypes } from "./types";

interface IKycOnboardingFooterProps {
  currentStep: KycOnboardingTypes.TStep;
  currentIndex: number;
  onPreviousStep: () => void;
  handleSubmit: () => void;
  submitting: boolean;
  onNextStep: () => void;
}

export default function KycOnboardingFooter({
  currentStep,
  currentIndex,
  onPreviousStep,
  handleSubmit,
  submitting,
  onNextStep,
}: IKycOnboardingFooterProps) {
  return (
    <div className="px-7 py-4 border-t border-border/60 flex items-center justify-between">
      {currentIndex > 0 ? (
        <RippleButton
          onClick={onPreviousStep}
          rippleColor="rgba(0,0,0,0.08)"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-[0.97]"
        >
          <ArrowLeft size={15} /> Voltar
        </RippleButton>
      ) : (
        <div />
      )}

      {currentStep === "review" ? (
        <RippleButton
          onClick={handleSubmit}
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
          onClick={onNextStep}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.97]"
        >
          Continuar <ArrowRight size={15} />
        </RippleButton>
      )}
    </div>
  );
}
