import { Shield } from "lucide-react";
import { KycOnboardingTypes } from "./types";

const STEP_LABELS: Record<KycOnboardingTypes.TStep, string> = {
  type: "Tipo",
  personal: "Dados",
  address: "Endereço",
  documents: "Documentos",
  bank: "Banco",
  review: "Revisão",
};

interface IKycOnboardingHeaderProps {
  steps: KycOnboardingTypes.TStep[];
  currentIndex: number;
}

export default function KycOnboardingHeader({
  steps,
  currentIndex,
}: IKycOnboardingHeaderProps) {
  return (
    <div className="px-7 pt-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="text-primary" size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Verificação de Identidade
          </h2>
          <p className="text-xs text-muted-foreground">
            Preencha seus dados para ativar sua conta
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mt-5">
        {steps.map((s, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full h-1 rounded-full transition-all duration-500 ${
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
  );
}
