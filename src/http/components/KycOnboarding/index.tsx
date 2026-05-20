import { useApiService } from "@/http/hooks/use-api-service";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { useState } from "react";
import KycOnboardingContent from "./KycOnboardingContent";
import KycOnboardingFooter from "./KycOnboardingFooter";
import KycOnboardingHeader from "./KycOnboardingHeader";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import { KycOnboardingTypes } from "./types";
import { validateKycOnboardingStep } from "./validators/validate-kyc-onboarding-step";

const STEPS: KycOnboardingTypes.TStep[] = [
  "type",
  "personal",
  "address",
  "documents",
  "bank",
  "review",
];

interface IKycOnboardingProps {
  onComplete: () => void;
}

export default function KycOnboarding({ onComplete }: IKycOnboardingProps) {
  const { user } = useAuthStore();

  const apiService = useApiService();

  const { form, files, setError, step, setStep } = useKycOnboardingStore();

  const [submitting, setSubmitting] = useState(false);

  const currentIndex = STEPS.indexOf(step);

  const handleNextStep = () => {
    try {
      validateKycOnboardingStep({ form, step, files });
      if (currentIndex < STEPS.length - 1) setStep(STEPS[currentIndex + 1]);
    } catch (error) {
      setError(getErrorMessageOrDefault(error, "Erro ao validar o formulário"));
      return;
    }
  };

  const handlePreviousStep = () => {
    if (currentIndex > 0) setStep(STEPS[currentIndex - 1]);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setError("");

    try {
      await apiService.modules.kycSubmission.submitSellerSubmission({
        personType: form.personType!,
        fullName: form.fullName,
        cpf: form.cpf || null,
        dateOfBirth: form.dateOfBirth || null,
        phone: form.phone,
        companyName: form.companyName || null,
        companyType: form.companyType || null,
        cnpj: form.cnpj || null,
        tradingName: form.tradingName || null,
        businessActivity: form.businessActivity || null,
        monthlyRevenue: form.monthlyRevenue || null,
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement || null,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        documentFrontUrl: files.document_front?.url ?? null,
        documentBackUrl: files.document_back?.url ?? null,
        selfieUrl: files.selfie?.url ?? null,
        proofOfAddressUrl: files.proof_of_address?.url ?? null,
        companyContractUrl: files.company_contract?.url ?? null,
        bank: form.bank,
      });
      onComplete();
    } catch (error) {
      setError(getErrorMessageOrDefault(error, "Erro ao enviar KYC"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-backdrop-enter" />

      <div className="relative w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-lg overflow-hidden animate-modal-enter max-h-[90vh] flex flex-col">
        <KycOnboardingHeader steps={STEPS} currentIndex={currentIndex} />

        <KycOnboardingContent />

        <KycOnboardingFooter
          currentStep={step}
          currentIndex={currentIndex}
          onPreviousStep={handlePreviousStep}
          handleSubmit={handleSubmit}
          submitting={submitting}
          onNextStep={handleNextStep}
        />
      </div>
    </div>
  );
}
