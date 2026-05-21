import { create } from "zustand";

type TStep = "email" | "new-password";

interface IResetPasswordPageStore {
  step: TStep;
  setStep: (step: TStep) => void;

  email: string;
  setEmail: (email: string) => void;
  code: string;
  setCode: (code: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  passwordIsStrong: boolean;
  setPasswordIsStrong: (passwordIsStrong: boolean) => void;

  success: boolean;
  setSuccess: (success: boolean) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useResetPasswordPageStore = create<IResetPasswordPageStore>(
  (set) => ({
    step: "email",
    setStep: (step) => set({ step }),

    email: "",
    setEmail: (email) => set({ email }),
    code: "",
    setCode: (code) => set({ code }),
    password: "",
    setPassword: (password) => set({ password }),
    confirmPassword: "",
    setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
    passwordIsStrong: false,
    setPasswordIsStrong: (passwordIsStrong) => set({ passwordIsStrong }),

    success: false,
    setSuccess: (success) => set({ success }),

    loading: false,
    setLoading: (loading) => set({ loading }),
  })
);
