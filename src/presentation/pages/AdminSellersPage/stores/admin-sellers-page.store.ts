import { create } from "zustand";
import { TFilterKey } from "../types/filter-key.type";

export interface IAdminSellersPageStore {
  filter: TFilterKey;
  setFilter: (filter: TFilterKey) => void;
}

export const useAdminSellersPageStore = create<IAdminSellersPageStore>(
  (set) => ({
    filter: "all",
    setFilter: (filter) => set({ filter }),
  }),
);
