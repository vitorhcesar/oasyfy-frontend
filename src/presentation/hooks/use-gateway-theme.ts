import { IGatewayThemeDto } from "@/infra/http/services/api/modules/gateway-theme.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

function applyTheme(theme: IGatewayThemeDto, isDark: boolean) {
  const root = document.documentElement;

  root.style.setProperty(
    "--primary",
    isDark ? theme.darkPrimaryColor : theme.primaryColor,
  );
  root.style.setProperty(
    "--background",
    isDark ? theme.darkBackgroundColor : theme.backgroundColor,
  );
  root.style.setProperty(
    "--foreground",
    isDark ? theme.darkForegroundColor : theme.foregroundColor,
  );
  root.style.setProperty(
    "--card",
    isDark ? theme.darkCardColor : theme.cardColor,
  );
  root.style.setProperty(
    "--card-foreground",
    isDark ? theme.darkCardForeground : theme.cardForeground,
  );
  root.style.setProperty(
    "--popover",
    isDark ? theme.darkCardColor : theme.cardColor,
  );
  root.style.setProperty(
    "--popover-foreground",
    isDark ? theme.darkCardForeground : theme.cardForeground,
  );
  root.style.setProperty(
    "--border",
    isDark ? theme.darkBorderColor : theme.borderColor,
  );
  root.style.setProperty(
    "--input",
    isDark ? theme.darkBorderColor : theme.borderColor,
  );
  root.style.setProperty(
    "--muted",
    isDark ? theme.darkMutedColor : theme.mutedColor,
  );
  root.style.setProperty(
    "--muted-foreground",
    isDark ? theme.darkMutedForeground : theme.mutedForeground,
  );
  root.style.setProperty(
    "--accent",
    isDark ? theme.darkAccentColor : theme.accentColor,
  );
  root.style.setProperty(
    "--accent-foreground",
    isDark ? theme.darkAccentForeground : theme.accentForeground,
  );
  root.style.setProperty(
    "--ring",
    isDark ? theme.darkPrimaryColor : theme.primaryColor,
  );
  root.style.setProperty(
    "--sidebar-primary",
    isDark ? theme.darkPrimaryColor : theme.primaryColor,
  );
  root.style.setProperty(
    "--sidebar-ring",
    isDark ? theme.darkPrimaryColor : theme.primaryColor,
  );

  // These don't have dark variants in the table, use light values
  if (!isDark) {
    root.style.setProperty("--primary-foreground", theme.primaryForeground);
    root.style.setProperty("--destructive", theme.destructiveColor);
    root.style.setProperty("--success", theme.successColor);
    root.style.setProperty("--warning", theme.warningColor);
  } else {
    root.style.setProperty("--primary-foreground", theme.primaryForeground);
    root.style.setProperty("--destructive", theme.destructiveColor);
    root.style.setProperty("--success", theme.successColor);
    root.style.setProperty("--warning", theme.warningColor);
  }
}

export default function useGatewayTheme() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const QUERY_KEY = ["gateway-theme"];

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const theme = await apiService.modules.gatewayTheme.find();
      applyTheme(theme, document.documentElement.classList.contains("dark"));
      return theme;
    },
  });

  useEffect(() => {
    // Observe class changes on <html> to detect theme toggle
    const observer = new MutationObserver(() => {
      if (query.data) {
        const isDark = document.documentElement.classList.contains("dark");
        applyTheme(query.data, isDark);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [query.data]);

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  return {
    ...query,
    data: query.data ?? null,
    invalidateQuery,
  };
}
