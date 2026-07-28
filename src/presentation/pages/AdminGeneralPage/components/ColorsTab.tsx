import type { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";
import { Eye, Layout, Loader2, Palette, Type } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useGatewayTheme from "../../../hooks/use-gateway-theme";
import { useColorsTabStore } from "../stores/colors-tab.store";
import { IColorGroup } from "../types/color-group.type";
import { applyThemeToDOM } from "../utils/apply-theme-to-dom";
import { ColorCard } from "./ColorCard";
import { ColorsTabLivePreview } from "./ColorsTabLivePreview";
import ColorsTabTopBar from "./ColorsTabTopBar";

const lightGroups: IColorGroup[] = [
  {
    title: "Marca",
    icon: Palette,
    fields: [
      {
        key: "primaryColor",
        label: "Primária",
        description: "Cor principal da interface",
      },
      {
        key: "primaryForeground",
        label: "Texto primário",
        description: "Texto sobre a cor primária",
      },
      {
        key: "successColor",
        label: "Sucesso",
        description: "Indicadores positivos",
      },
      {
        key: "warningColor",
        label: "Alerta",
        description: "Indicadores de aviso",
      },
      {
        key: "destructiveColor",
        label: "Destrutivo",
        description: "Ações perigosas e erros",
      },
    ],
  },
  {
    title: "Superfícies",
    icon: Layout,
    fields: [
      {
        key: "backgroundColor",
        label: "Fundo",
        description: "Fundo principal da página",
      },
      {
        key: "cardColor",
        label: "Card",
        description: "Fundo dos cards e painéis",
      },
      {
        key: "borderColor",
        label: "Borda",
        description: "Bordas e divisores",
      },
      {
        key: "mutedColor",
        label: "Muted",
        description: "Fundos suaves e inputs",
      },
      {
        key: "accentColor",
        label: "Accent",
        description: "Destaque suave em hovers",
      },
    ],
  },
  {
    title: "Tipografia",
    icon: Type,
    fields: [
      {
        key: "foregroundColor",
        label: "Texto",
        description: "Texto principal",
      },
      {
        key: "cardForeground",
        label: "Texto card",
        description: "Texto dentro de cards",
      },
      {
        key: "mutedForeground",
        label: "Texto muted",
        description: "Textos secundários",
      },
      {
        key: "accentForeground",
        label: "Texto accent",
        description: "Texto sobre accent",
      },
    ],
  },
];

const darkGroups: IColorGroup[] = [
  {
    title: "Marca",
    icon: Palette,
    fields: [
      {
        key: "darkPrimaryColor",
        label: "Primária",
        description: "Cor principal da interface",
      },
    ],
  },
  {
    title: "Superfícies",
    icon: Layout,
    fields: [
      {
        key: "darkBackgroundColor",
        label: "Fundo",
        description: "Fundo principal",
      },
      { key: "darkCardColor", label: "Card", description: "Fundo dos cards" },
      {
        key: "darkBorderColor",
        label: "Borda",
        description: "Bordas e divisores",
      },
      { key: "darkMutedColor", label: "Muted", description: "Fundos suaves" },
      {
        key: "darkAccentColor",
        label: "Accent",
        description: "Destaque suave",
      },
    ],
  },
  {
    title: "Tipografia",
    icon: Type,
    fields: [
      {
        key: "darkForegroundColor",
        label: "Texto",
        description: "Texto principal",
      },
      {
        key: "darkCardForeground",
        label: "Texto card",
        description: "Texto em cards",
      },
      {
        key: "darkMutedForeground",
        label: "Texto muted",
        description: "Textos secundários",
      },
      {
        key: "darkAccentForeground",
        label: "Texto accent",
        description: "Texto sobre accent",
      },
    ],
  },
];

function hslToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#33a06f";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s: number;

  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100,
  )}%`;
}

export function ColorsTab() {
  const {
    data: fetchedTheme,
    isLoading: isLoadingGatewayTheme,
    isError: isErrorOnGatewayTheme,
    invalidateQuery: invalidateGatewayThemeQuery,
  } = useGatewayTheme();

  const { mode } = useColorsTabStore();

  const [theme, setTheme] = useState<IGatewayThemeColors | null>(null);

  useEffect(() => {
    if (fetchedTheme) {
      setTheme(fetchedTheme);
    }
  }, [fetchedTheme]);

  useEffect(() => {
    if (isErrorOnGatewayTheme) {
      toast.error("Erro ao carregar tema");
    }
  }, [isErrorOnGatewayTheme]);

  const updateColor = useCallback(
    (key: Exclude<keyof IGatewayThemeColors, "id">, hex: string) => {
      if (!theme) return;
      const hsl = hexToHsl(hex);
      const updated = { ...theme, [key]: hsl };
      setTheme(updated);
      if (!key.startsWith("dark_")) applyThemeToDOM(updated);
    },
    [theme],
  );

  if (isLoadingGatewayTheme) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="admin-surface px-6 py-12 text-center">
        <p className="text-base text-muted-foreground">Tema não encontrado.</p>
      </div>
    );
  }

  const groups = mode === "light" ? lightGroups : darkGroups;

  return (
    <div className="space-y-5">
      <ColorsTabTopBar
        invalidateGatewayThemeQuery={invalidateGatewayThemeQuery}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {groups.map((group) => (
            <div key={group.title} className="admin-surface overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                  <group.icon size={15} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {group.fields.length}{" "}
                    {group.fields.length === 1 ? "cor" : "cores"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 p-3">
                {group.fields.map((field) => {
                  const hslValue = theme[field.key] || "";
                  const hexValue = hslToHex(hslValue);
                  return (
                    <ColorCard
                      key={field.key}
                      field={field}
                      hex={hexValue}
                      onChange={(hex) => updateColor(field.key, hex)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-3 lg:sticky lg:top-6">
            <div className="admin-surface overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3.5">
                <Eye size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Preview
                </h3>
                <span className="ml-auto text-xs font-medium text-muted-foreground">
                  {mode === "light" ? "Modo claro" : "Modo escuro"}
                </span>
              </div>
              <div className="p-3">
                <ColorsTabLivePreview theme={theme} mode={mode} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
