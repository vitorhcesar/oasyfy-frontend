import type { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Layout,
  Loader2,
  Moon,
  Palette,
  Pipette,
  RotateCcw,
  Save,
  Search,
  Sun,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useGatewayTheme from "../../../hooks/use-gateway-theme";

const DEFAULT_LIGHT: Record<string, string> = {
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

const DEFAULT_DARK: Record<string, string> = {
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

interface IColorField {
  key: Exclude<keyof IGatewayThemeColors, "id">;
  label: string;
  description: string;
}

interface IColorGroup {
  title: string;
  icon: React.ElementType;
  fields: IColorField[];
}

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

function applyThemeToDOM(theme: IGatewayThemeColors) {
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

function ColorCard({
  field,
  hex,
  onChange,
}: {
  field: IColorField;
  hex: string;
  onChange: (hex: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(hex);

  useEffect(() => {
    setInputValue(hex);
  }, [hex]);

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-border/30 bg-background/60 hover:bg-background hover:border-border/60 p-3 transition-all duration-200">
      <label className="relative cursor-pointer shrink-0">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className="w-10 h-10 rounded-xl shadow-sm ring-1 ring-black/5 group-hover:ring-black/10 group-hover:scale-105 transition-all duration-200 relative overflow-hidden"
          style={{ backgroundColor: hex }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/15 backdrop-blur-[1px]">
            <Pipette size={12} className="text-white drop-shadow" />
          </div>
        </div>
      </label>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">
          {field.label}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {field.description}
        </p>
      </div>
      <div className="shrink-0">
        {editing ? (
          <input
            type="text"
            value={inputValue}
            autoFocus
            onBlur={() => {
              setEditing(false);
              if (/^#[0-9a-fA-F]{6}$/.test(inputValue)) onChange(inputValue);
              else setInputValue(hex);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
                if (/^#[0-9a-fA-F]{6}$/.test(inputValue)) onChange(inputValue);
                else setInputValue(hex);
              }
              if (e.key === "Escape") {
                setEditing(false);
                setInputValue(hex);
              }
            }}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-20 text-[11px] font-mono bg-background border border-primary/40 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-lg px-2.5 py-1.5 transition-all"
          >
            {hex.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}

function LivePreview({
  theme,
  mode,
}: {
  theme: IGatewayThemeColors;
  mode: "light" | "dark";
}) {
  const bg =
    mode === "light" ? theme.backgroundColor : theme.darkBackgroundColor;
  const fg =
    mode === "light" ? theme.foregroundColor : theme.darkForegroundColor;
  const card = mode === "light" ? theme.cardColor : theme.darkCardColor;
  const cardFg =
    mode === "light" ? theme.cardForeground : theme.darkCardForeground;
  const border = mode === "light" ? theme.borderColor : theme.darkBorderColor;
  const muted =
    mode === "light" ? theme.mutedForeground : theme.darkMutedForeground;
  const primary =
    mode === "light" ? theme.primaryColor : theme.darkPrimaryColor;
  const mutedBg = mode === "light" ? theme.mutedColor : theme.darkMutedColor;

  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-colors duration-300 h-full"
      style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}
    >
      {/* Nav */}
      <div
        className="flex items-center justify-between pb-3"
        style={{ borderBottom: `1px solid hsl(${border})` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `hsl(${primary})` }}
          >
            <span
              className="text-[10px] font-bold"
              style={{ color: `hsl(${theme.primaryForeground})` }}
            >
              O
            </span>
          </div>
          <span className="text-xs font-bold" style={{ color: `hsl(${fg})` }}>
            Oasyfy
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-medium"
            style={{ color: `hsl(${muted})` }}
          >
            Dashboard
          </span>
          <span
            className="text-[10px] font-medium"
            style={{ color: `hsl(${muted})` }}
          >
            Transações
          </span>
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: `hsl(${mutedBg})` }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold shadow-sm"
          style={{
            backgroundColor: `hsl(${primary})`,
            color: `hsl(${theme.primaryForeground})`,
          }}
        >
          Primário
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${theme.successColor})`,
            color: "white",
          }}
        >
          Sucesso
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${theme.warningColor})`,
            color: "white",
          }}
        >
          Alerta
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${theme.destructiveColor})`,
            color: "white",
          }}
        >
          Erro
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold border"
          style={{ borderColor: `hsl(${border})`, color: `hsl(${fg})` }}
        >
          Outline
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: `hsl(${card})`,
            border: `1px solid hsl(${border})`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle
              size={11}
              style={{ color: `hsl(${theme.successColor})` }}
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: `hsl(${cardFg})` }}
            >
              Aprovado
            </span>
          </div>
          <p
            className="text-base font-bold leading-none"
            style={{ color: `hsl(${cardFg})` }}
          >
            R$ 1.234,56
          </p>
          <p className="text-[9px] mt-1" style={{ color: `hsl(${muted})` }}>
            Volume do período
          </p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: `hsl(${card})`,
            border: `1px solid hsl(${border})`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle
              size={11}
              style={{ color: `hsl(${theme.warningColor})` }}
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: `hsl(${cardFg})` }}
            >
              Pendente
            </span>
          </div>
          <p
            className="text-base font-bold leading-none"
            style={{ color: `hsl(${cardFg})` }}
          >
            12
          </p>
          <p className="text-[9px] mt-1" style={{ color: `hsl(${muted})` }}>
            Transações
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-lg px-3 py-2 text-[10px] flex items-center gap-2"
          style={{
            backgroundColor: `hsl(${card})`,
            border: `1px solid hsl(${border})`,
            color: `hsl(${muted})`,
          }}
        >
          <Search size={10} style={{ color: `hsl(${muted})` }} />
          Pesquisar transações...
        </div>
        <div
          className="px-3 py-2 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${primary})`,
            color: `hsl(${theme.primaryForeground})`,
          }}
        >
          Buscar
        </div>
      </div>

      {/* Table preview */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid hsl(${border})` }}
      >
        <div
          className="flex items-center text-[9px] font-semibold px-3 py-2"
          style={{ backgroundColor: `hsl(${mutedBg})`, color: `hsl(${muted})` }}
        >
          <span className="flex-1">Nome</span>
          <span className="w-20 text-right">Valor</span>
          <span className="w-16 text-right">Status</span>
        </div>
        {[
          {
            name: "João Silva",
            amount: "R$ 89,90",
            status: "Pago",
            statusColor: theme.successColor,
          },
          {
            name: "Maria Santos",
            amount: "R$ 245,00",
            status: "Pendente",
            statusColor: theme.warningColor,
          },
        ].map((row, i) => (
          <div
            key={i}
            className="flex items-center text-[10px] px-3 py-2"
            style={{
              backgroundColor: `hsl(${card})`,
              borderTop: `1px solid hsl(${border})`,
            }}
          >
            <span
              className="flex-1 font-medium"
              style={{ color: `hsl(${cardFg})` }}
            >
              {row.name}
            </span>
            <span
              className="w-20 text-right font-medium"
              style={{ color: `hsl(${cardFg})` }}
            >
              {row.amount}
            </span>
            <span className="w-16 text-right">
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold"
                style={{
                  backgroundColor: `hsl(${row.statusColor} / 0.12)`,
                  color: `hsl(${row.statusColor})`,
                }}
              >
                {row.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColorsTab() {
  const apiService = useApiService();

  const {
    data: fetchedTheme,
    isLoading: isLoadingGatewayTheme,
    isError: isErrorOnGatewayTheme,
    invalidateQuery: invalidateGatewayThemeQuery,
  } = useGatewayTheme();

  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<IGatewayThemeColors | null>(null);
  const [mode, setMode] = useState<"light" | "dark">("light");

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

  const handleSave = async () => {
    if (!theme) return;

    setSaving(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.gatewayTheme.update({
          primaryColor: theme.primaryColor,
          primaryForeground: theme.primaryForeground,
          backgroundColor: theme.backgroundColor,
          foregroundColor: theme.foregroundColor,
          cardColor: theme.cardColor,
          cardForeground: theme.cardForeground,
          borderColor: theme.borderColor,
          mutedColor: theme.mutedColor,
          mutedForeground: theme.mutedForeground,
          accentColor: theme.accentColor,
          accentForeground: theme.accentForeground,
          destructiveColor: theme.destructiveColor,
          successColor: theme.successColor,
          warningColor: theme.warningColor,
          darkPrimaryColor: theme.darkPrimaryColor,
          darkBackgroundColor: theme.darkBackgroundColor,
          darkForegroundColor: theme.darkForegroundColor,
          darkCardColor: theme.darkCardColor,
          darkCardForeground: theme.darkCardForeground,
          darkBorderColor: theme.darkBorderColor,
          darkMutedColor: theme.darkMutedColor,
          darkMutedForeground: theme.darkMutedForeground,
          darkAccentColor: theme.darkAccentColor,
          darkAccentForeground: theme.darkAccentForeground,
        });
        await invalidateGatewayThemeQuery();

        toast.success("Tema salvo com sucesso!");
      },
      {
        defaultErrorMessage: "Erro ao salvar tema",
        finallyFn: () => {
          setSaving(false);
        },
      },
    );
  };

  const handleReset = () => {
    if (!theme) return;

    const defaults =
      mode === "light" ? { ...DEFAULT_LIGHT } : { ...DEFAULT_DARK };
    const updated = { ...theme, ...defaults };

    setTheme(updated);

    if (mode === "light") applyThemeToDOM(updated);
    toast.info("Cores restauradas para o padrão");
  };

  if (isLoadingGatewayTheme) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Tema não encontrado.</p>
      </div>
    );
  }

  const groups = mode === "light" ? lightGroups : darkGroups;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 border border-border/30">
          <button
            onClick={() => setMode("light")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              mode === "light"
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sun size={13} /> Claro
          </button>
          <button
            onClick={() => setMode("dark")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              mode === "dark"
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Moon size={13} /> Escuro
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            <RotateCcw size={12} /> Restaurar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Salvar
          </button>
        </div>
      </div>

      {/* Main content: editor + preview side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Color editor — 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          {groups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-border/40 bg-card overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center">
                  <group.icon size={13} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-foreground">
                    {group.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    {group.fields.length}{" "}
                    {group.fields.length === 1 ? "cor" : "cores"}
                  </p>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
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

        {/* Live preview — 2 cols, sticky */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-3">
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                <Eye size={13} className="text-muted-foreground" />
                <h3 className="text-[13px] font-semibold text-foreground">
                  Preview
                </h3>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {mode === "light" ? "Modo claro" : "Modo escuro"}
                </span>
              </div>
              <div className="p-3">
                <LivePreview theme={theme} mode={mode} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
