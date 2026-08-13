import { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";
import { create } from "zustand";

const DEFAULT_LIGHT: Partial<IGatewayThemeColors> = {
  primaryColor: "142 71% 45%",
  primaryForeground: "0 0% 100%",
  backgroundColor: "210 20% 98%",
  foregroundColor: "222 47% 11%",
  cardColor: "0 0% 100%",
  cardForeground: "222 47% 11%",
  borderColor: "220 13% 91%",
  mutedColor: "220 14% 96%",
  mutedForeground: "220 9% 46%",
  accentColor: "142 76% 94%",
  accentForeground: "142 64% 24%",
  destructiveColor: "0 72% 55%",
  successColor: "142 71% 45%",
  warningColor: "38 90% 50%",
};

const DEFAULT_DARK: Partial<IGatewayThemeColors> = {
  darkPrimaryColor: "142 71% 45%",
  darkBackgroundColor: "0 0% 6%",
  darkForegroundColor: "0 0% 100%",
  darkCardColor: "0 0% 11%",
  darkCardForeground: "0 0% 100%",
  darkBorderColor: "0 0% 18%",
  darkMutedColor: "0 0% 12%",
  darkMutedForeground: "220 9% 65%",
  darkAccentColor: "142 20% 12%",
  darkAccentForeground: "0 0% 98%",
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
