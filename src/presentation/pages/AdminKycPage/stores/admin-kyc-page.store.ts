import { create } from "zustand";
import { TKycFilter } from "../types/kyc-filter.type";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";

export interface IAdminKycPageStore {
  filter: TKycFilter;
  setFilter: (filter: TKycFilter) => void;
  search: string;
  setSearch: (search: string) => void;
  selectedSeller: IKycSubmissionView | null;
  setSelectedSeller: (selectedSeller: IKycSubmissionView | null) => void;
}

export const useAdminKycPageStore = create<IAdminKycPageStore>((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
  search: "",
  setSearch: (search) => set({ search }),
  selectedSeller: null,
  setSelectedSeller: (selectedSeller) => set({ selectedSeller }),
}));
