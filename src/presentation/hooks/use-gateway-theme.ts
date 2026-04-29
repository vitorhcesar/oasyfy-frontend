import { supabase } from "@/infra/integrations/supabase/client";
import { useEffect } from "react";

let cachedTheme: Record<string, any> | null = null;

function applyTheme(t: Record<string, any>, isDark: boolean) {
  const root = document.documentElement;
  const prefix = isDark ? "dark_" : "";

  root.style.setProperty("--primary", t[`${prefix}primary_color`]);
  root.style.setProperty("--background", t[`${prefix}background_color`]);
  root.style.setProperty("--foreground", t[`${prefix}foreground_color`]);
  root.style.setProperty("--card", t[`${prefix}card_color`]);
  root.style.setProperty("--card-foreground", t[`${prefix}card_foreground`]);
  root.style.setProperty("--popover", t[`${prefix}card_color`]);
  root.style.setProperty("--popover-foreground", t[`${prefix}card_foreground`]);
  root.style.setProperty("--border", t[`${prefix}border_color`]);
  root.style.setProperty("--input", t[`${prefix}border_color`]);
  root.style.setProperty("--muted", t[`${prefix}muted_color`]);
  root.style.setProperty("--muted-foreground", t[`${prefix}muted_foreground`]);
  root.style.setProperty("--accent", t[`${prefix}accent_color`]);
  root.style.setProperty(
    "--accent-foreground",
    t[`${prefix}accent_foreground`]
  );
  root.style.setProperty("--ring", t[`${prefix}primary_color`]);
  root.style.setProperty("--sidebar-primary", t[`${prefix}primary_color`]);
  root.style.setProperty("--sidebar-ring", t[`${prefix}primary_color`]);

  // These don't have dark variants in the table, use light values
  if (!isDark) {
    root.style.setProperty("--primary-foreground", t.primary_foreground);
    root.style.setProperty("--destructive", t.destructive_color);
    root.style.setProperty("--success", t.success_color);
    root.style.setProperty("--warning", t.warning_color);
  } else {
    root.style.setProperty("--primary-foreground", t.primary_foreground);
    root.style.setProperty("--destructive", t.destructive_color);
    root.style.setProperty("--success", t.success_color);
    root.style.setProperty("--warning", t.warning_color);
  }
}

export function useGatewayTheme() {
  useEffect(() => {
    const fetchAndApply = async () => {
      if (!cachedTheme) {
        const { data } = await supabase
          .from("gateway_theme")
          .select("*")
          .limit(1);
        if (data && data.length > 0) cachedTheme = data[0];
      }
      if (cachedTheme) {
        const isDark = document.documentElement.classList.contains("dark");
        applyTheme(cachedTheme, isDark);
      }
    };

    fetchAndApply();

    // Observe class changes on <html> to detect theme toggle
    const observer = new MutationObserver(() => {
      if (cachedTheme) {
        const isDark = document.documentElement.classList.contains("dark");
        applyTheme(cachedTheme, isDark);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);
}
