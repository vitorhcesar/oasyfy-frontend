import { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";
import { create } from "zustand";

const DEFAULT_LIGHT: Partial<IGatewayThemeColors> = {
  primaryColor: "269 58% 38%",
  primaryForeground: "0 0% 100%",
  backgroundColor: "0 0% 98%",
  foregroundColor: "0 0% 4%",
  cardColor: "0 0% 100%",
  cardForeground: "0 0% 4%",
  borderColor: "270 10% 90%",
  mutedColor: "270 15% 96%",
  mutedForeground: "0 0% 40%",
  accentColor: "269 40% 96%",
  accentForeground: "269 58% 28%",
  destructiveColor: "0 72% 55%",
  successColor: "152 60% 40%",
  warningColor: "38 90% 50%",
};

const DEFAULT_DARK: Partial<IGatewayThemeColors> = {
  darkPrimaryColor: "269 58% 45%",
  darkBackgroundColor: "268 58% 6%",
  darkForegroundColor: "0 0% 98%",
  darkCardColor: "268 30% 10%",
  darkCardForeground: "0 0% 98%",
  darkBorderColor: "270 15% 18%",
  darkMutedColor: "268 25% 12%",
  darkMutedForeground: "0 0% 58%",
  darkAccentColor: "269 55% 18%",
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
