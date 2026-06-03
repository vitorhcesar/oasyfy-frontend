import { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";
import { create } from "zustand";

const DEFAULT_LIGHT: Partial<IGatewayThemeColors> = {
  primaryColor: "152 60% 42%",
  primaryForeground: "0 0% 100%",
  backgroundColor: "0 0% 99%",
  foregroundColor: "150 15% 10%",
  cardColor: "0 0% 100%",
  cardForeground: "150 15% 10%",
  borderColor: "150 10% 92%",
  mutedColor: "150 10% 96%",
  mutedForeground: "150 8% 32%",
  accentColor: "150 20% 96%",
  accentForeground: "150 15% 10%",
  destructiveColor: "0 72% 55%",
  successColor: "152 60% 42%",
  warningColor: "38 90% 50%",
};

const DEFAULT_DARK: Partial<IGatewayThemeColors> = {
  darkPrimaryColor: "152 60% 45%",
  darkBackgroundColor: "160 15% 5%",
  darkForegroundColor: "150 10% 95%",
  darkCardColor: "160 12% 8%",
  darkCardForeground: "150 10% 95%",
  darkBorderColor: "155 10% 15%",
  darkMutedColor: "155 10% 12%",
  darkMutedForeground: "150 8% 68%",
  darkAccentColor: "155 12% 13%",
  darkAccentForeground: "150 10% 93%",
};

export interface IColorsTabStore {
  // state
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  theme: IGatewayThemeColors | null;
  setTheme: (theme: IGatewayThemeColors | null) => void;

  // actions
  resetTheme: () => IGatewayThemeColors | null;
}

export const useColorsTabStore = create<IColorsTabStore>()((set, get) => ({
  // state
  mode: "light",
  setMode: (mode: "light" | "dark") => set({ mode }),
  saving: false,
  setSaving: (saving: boolean) => set({ saving }),
  theme: null,
  setTheme: (theme: IGatewayThemeColors | null) => set({ theme }),

  // actions
  resetTheme: (): IGatewayThemeColors | null => {
    const theme = get().theme;
    if (!theme) return null;

    const defaults = get().mode === "light" ? DEFAULT_LIGHT : DEFAULT_DARK;
    const updated = { ...theme, ...defaults };
    set({ theme: updated });

    return updated;
  },
}));
