import { create } from "zustand";
import { TAdminDashboardPeriod } from "../types/admin-dashboard-period.type";

export interface IAdminDashboardPageStore {
  period: TAdminDashboardPeriod;
  setPeriod: (period: TAdminDashboardPeriod) => void;
  customFrom: Date | undefined;
  setCustomFrom: (customFrom: Date | undefined) => void;
  customTo: Date | undefined;
  setCustomTo: (customTo: Date | undefined) => void;
}

export const useAdminDashboardPageStore = create<IAdminDashboardPageStore>(
  (set) => ({
    period: "30d",
    setPeriod: (period) => set({ period }),
    customFrom: undefined,
    setCustomFrom: (customFrom) => set({ customFrom }),
    customTo: undefined,
    setCustomTo: (customTo) => set({ customTo }),
  }),
);
