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

  switch (step) {
    case "type":
      return <TypeStep />;
    case "personal":
      return <PersonalStep />;
    case "address":
      return <AddressStep />;
    case "documents":
      return <DocumentsStep />;
    case "bank":
      return <BankStep />;
    case "review":
      return <ReviewStep />;
    default:
      throw new AppError("Step not found on KycOnboardingSteps", 500, { step });
  }
}
