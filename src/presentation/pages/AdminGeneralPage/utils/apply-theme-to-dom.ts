import { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";

export function applyThemeToDOM(theme: IGatewayThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primaryColor);
  root.style.setProperty("--primary-foreground", theme.primaryForeground);
  root.style.setProperty("--background", theme.backgroundColor);
  root.style.setProperty("--foreground", theme.foregroundColor);
  root.style.setProperty("--card", theme.cardColor);
  root.style.setProperty("--card-foreground", theme.cardForeground);
  root.style.setProperty("--border", theme.borderColor);
  root.style.setProperty("--input", theme.borderColor);
  root.style.setProperty("--muted", theme.mutedColor);
  root.style.setProperty("--muted-foreground", theme.mutedForeground);
  root.style.setProperty("--accent", theme.accentColor);
  root.style.setProperty("--accent-foreground", theme.accentForeground);
  root.style.setProperty("--destructive", theme.destructiveColor);
  root.style.setProperty("--success", theme.successColor);
  root.style.setProperty("--warning", theme.warningColor);
  root.style.setProperty("--ring", theme.primaryColor);
  root.style.setProperty("--sidebar-primary", theme.primaryColor);
  root.style.setProperty("--sidebar-ring", theme.primaryColor);
}
