import { Building2, User } from "lucide-react";
import { RippleButton } from "../ui/ripple-button";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";

export default function TypeStep() {
  const { form, setFormDataValue, setError } = useKycOnboardingStore();

  return (
    <div className="space-y-5 animate-step-slide">
      <p className="text-sm text-muted-foreground">
        Como você vai operar na plataforma?
      </p>
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            ["pf", "Pessoa Física", "CPF, RG e dados pessoais", User],
            [
              "pj",
              "Pessoa Jurídica",
              "CNPJ, contrato social e dados da empresa",
              Building2,
            ],
          ] as const
        ).map(([type, title, desc, Icon]) => (
          <RippleButton
            key={type}
            onClick={() => {
              setFormDataValue("personType", type);
              setError("");
            }}
            rippleColor="rgba(0,0,0,0.06)"
            className={`group p-5 rounded-xl border text-left transition-all duration-200 ${
              form.personType === type
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all ${
                form.personType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:text-primary"
              }`}
            >
              <Icon size={20} />
            </div>
            <p className="font-semibold text-foreground text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {desc}
            </p>
          </RippleButton>
        ))}
      </div>
    </div>
  );
}
