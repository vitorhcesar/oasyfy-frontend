import { useAuthStore } from "@/http/stores/useAuthStore";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { supabase } from "@/infra/integrations/supabase/client";
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

    const { error: dbErr } = await supabase.from("kyc_submissions").insert({
      user_id: user.id,
      email: user.email || null,
      person_type: form.personType!,
      full_name: form.fullName,
      cpf: form.cpf || null,
      date_of_birth: form.dateOfBirth || null,
      phone: form.phone,
      company_name: form.companyName || null,
      company_type: form.companyType || null,
      cnpj: form.cnpj || null,
      trading_name: form.tradingName || null,
      business_activity: form.businessActivity || null,
      monthly_revenue: form.monthlyRevenue || null,
      zip_code: form.zipCode,
      street: form.street,
      number: form.number,
      complement: form.complement || null,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      document_front_url: files.document_front?.url || null,
      document_back_url: files.document_back?.url || null,
      selfie_url: files.selfie?.url || null,
      proof_of_address_url: files.proof_of_address?.url || null,
      company_contract_url: files.company_contract?.url || null,
      bank_data: form.bank as any,
      status: "under_review",
    });

    if (dbErr) {
      setError(dbErr.message);
      setSubmitting(false);
      return;
    }

    onComplete();
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
