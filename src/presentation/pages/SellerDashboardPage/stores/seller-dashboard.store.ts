import { DateRange } from "react-day-picker";
import { create } from "zustand";
import { TSellerDashboardTimeRange } from "../types/time-range.type";

export interface ISellerDashboardStore {
  timeRange: TSellerDashboardTimeRange;
  setTimeRange: (timeRange: TSellerDashboardTimeRange) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;
}

export const useSellerDashboardStore = create<ISellerDashboardStore>((set) => ({
  timeRange: "7d",
  setTimeRange: (timeRange) => set({ timeRange }),
  dateRange: undefined,
  setDateRange: (dateRange) => set({ dateRange }),
}));
