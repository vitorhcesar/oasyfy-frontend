import { AppError } from "@/domain/errors/app.error";
import AddressStep from "./AddressStep";
import BankStep from "./BankStep";
import DocumentsStep from "./DocumentsStep";
import PersonalStep from "./PersonalStep";
import ReviewStep from "./ReviewStep";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import TypeStep from "./TypeStep";

export default function KycOnboardingSteps() {
  const { step } = useKycOnboardingStore();

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all text-foreground placeholder:text-muted-foreground/50";
  const labelClass =
    "block text-xs md:text-sm font-medium text-muted-foreground mb-1.5 tracking-wide";

  switch (step) {
    case "type":
      return <TypeStep />;
    case "personal":
      return <PersonalStep labelClass={labelClass} inputClass={inputClass} />;
    case "address":
      return <AddressStep labelClass={labelClass} inputClass={inputClass} />;
    case "documents":
      return <DocumentsStep labelClass={labelClass} />;
    case "bank":
      return <BankStep labelClass={labelClass} inputClass={inputClass} />;
    case "review":
      return <ReviewStep />;
    default:
      throw new AppError("Step not found on KycOnboardingSteps", 500, { step });
  }
}
