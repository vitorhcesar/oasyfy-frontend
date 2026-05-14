import { AlertCircle } from "lucide-react";
import KycOnboardingSteps from "./KycOnboardingSteps";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";

export default function KycOnboardingContent() {
  const { error } = useKycOnboardingStore();

  return (
    <div className="flex-1 overflow-y-auto px-7 py-4">
      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 animate-step-slide">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <KycOnboardingSteps />
    </div>
  );
}
