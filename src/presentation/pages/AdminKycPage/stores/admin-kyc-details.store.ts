import { create } from "zustand";
import { TAdminKycDetailsTab } from "../types/admin-kyc-details-tab.type";

export interface IAdminKycDetailsStore {
  // state
  tab: TAdminKycDetailsTab;
  setTab: (tab: TAdminKycDetailsTab) => void;
  actionsOpen: boolean;
  setActionsOpen: (actionsOpen: boolean) => void;
  blockReason: string;
  setBlockReason: (blockReason: string) => void;
  showBlockReasonModal: boolean;
  setShowBlockReasonModal: (showBlockReasonModal: boolean) => void;
}

export const useAdminKycDetailsStore = create<IAdminKycDetailsStore>((set) => ({
  // state
  tab: "kyc",
  setTab: (tab: TAdminKycDetailsTab) => set({ tab }),
  actionsOpen: false,
  setActionsOpen: (actionsOpen: boolean) => set({ actionsOpen }),
  blockReason: "",
  setBlockReason: (blockReason: string) => set({ blockReason }),
  showBlockReasonModal: false,
  setShowBlockReasonModal: (showBlockReasonModal: boolean) =>
    set({ showBlockReasonModal }),
}));
