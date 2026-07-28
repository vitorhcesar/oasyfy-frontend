import { useAuthContext } from "@/presentation/context/AuthContext";
import { LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login/seller");
  };

  return (
    <div className="px-7 pt-6 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
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

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>

      <div className="mt-5 flex items-center gap-1">
        {steps.map((s, i) => {
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
  );
}
