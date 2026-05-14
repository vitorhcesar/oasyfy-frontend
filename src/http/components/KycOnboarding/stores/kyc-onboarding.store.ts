import { create } from "zustand/react";
import { KycOnboardingTypes } from "../types";

export interface IKycOnboardingStore {
  // state
  form: KycOnboardingTypes.IFormData;
  setFormData: (form: KycOnboardingTypes.IFormData) => void;
  setFormDataValue: (
    field: keyof KycOnboardingTypes.IFormData,
    value: string
  ) => void;
  setBank: (field: keyof KycOnboardingTypes.IBankData, value: string) => void;

  isPj: boolean;

  error: string;
  setError: (error: string) => void;

  files: Record<string, KycOnboardingTypes.IUploadedFile>;
  setFiles: (files: Record<string, KycOnboardingTypes.IUploadedFile>) => void;

  step: KycOnboardingTypes.TStep;
  setStep: (step: KycOnboardingTypes.TStep) => void;
}

const initialBank: KycOnboardingTypes.IBankData = {
  bankName: "",
  agency: "",
  agencyDigit: "",
  account: "",
  accountDigit: "",
  accountType: "corrente",
  pixKeyType: "cpf",
  pixKey: "",
};

const initialForm: KycOnboardingTypes.IFormData = {
  personType: null,
  fullName: "",
  cpf: "",
  dateOfBirth: "",
  phone: "",
  companyName: "",
  companyType: "",
  cnpj: "",
  tradingName: "",
  businessActivity: "",
  monthlyRevenue: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  bank: { ...initialBank },
};

export const useKycOnboardingStore = create<IKycOnboardingStore>(
  (set, get) => ({
    form: initialForm,
    setFormData: (form) => set({ form }),
    setFormDataValue: (field, value) => {
      set((state) => ({ form: { ...state.form, [field]: value } }));
    },
    setBank: (field, value) => {
      set((state) => ({
        form: { ...state.form, bank: { ...state.form.bank, [field]: value } },
      }));
    },

    isPj: get().form.personType === "pj",

    error: "",
    setError: (error) => set({ error }),

    files: {},
    setFiles: (files) => set({ files }),

    step: "type",
    setStep: (step) => set({ step }),
  })
);
