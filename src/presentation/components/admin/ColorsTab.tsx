import { supabase } from "@/infrastructure/integrations/supabase/client";
import { cn } from "@/presentation/utils/cn";
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

interface ThemeColors {
  id: string;
  primary_color: string;
  primary_foreground: string;
  background_color: string;
  foreground_color: string;
  card_color: string;
  card_foreground: string;
  border_color: string;
  muted_color: string;
  muted_foreground: string;
  accent_color: string;
  accent_foreground: string;
  destructive_color: string;
  success_color: string;
  warning_color: string;
  dark_primary_color: string;
  dark_background_color: string;
  dark_foreground_color: string;
  dark_card_color: string;
  dark_card_foreground: string;
  dark_border_color: string;
  dark_muted_color: string;
  dark_muted_foreground: string;
  dark_accent_color: string;
  dark_accent_foreground: string;
}

const DEFAULT_LIGHT: Record<string, string> = {
  primary_color: "152 60% 42%",
  primary_foreground: "0 0% 100%",
  background_color: "0 0% 99%",
  foreground_color: "150 15% 10%",
  card_color: "0 0% 100%",
  card_foreground: "150 15% 10%",
  border_color: "150 10% 92%",
  muted_color: "150 10% 96%",
  muted_foreground: "150 8% 32%",
  accent_color: "150 20% 96%",
  accent_foreground: "150 15% 10%",
  destructive_color: "0 72% 55%",
  success_color: "152 60% 42%",
  warning_color: "38 90% 50%",
};

const DEFAULT_DARK: Record<string, string> = {
  dark_primary_color: "152 60% 45%",
  dark_background_color: "160 15% 5%",
  dark_foreground_color: "150 10% 95%",
  dark_card_color: "160 12% 8%",
  dark_card_foreground: "150 10% 95%",
  dark_border_color: "155 10% 15%",
  dark_muted_color: "155 10% 12%",
  dark_muted_foreground: "150 8% 68%",
  dark_accent_color: "155 12% 13%",
  dark_accent_foreground: "150 10% 93%",
};

interface IColorField {
  key: keyof ThemeColors;
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
        key: "primary_color",
        label: "Primária",
        description: "Cor principal da interface",
      },
      {
        key: "primary_foreground",
        label: "Texto primário",
        description: "Texto sobre a cor primária",
      },
      {
        key: "success_color",
        label: "Sucesso",
        description: "Indicadores positivos",
      },
      {
        key: "warning_color",
        label: "Alerta",
        description: "Indicadores de aviso",
      },
      {
        key: "destructive_color",
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
        key: "background_color",
        label: "Fundo",
        description: "Fundo principal da página",
      },
      {
        key: "card_color",
        label: "Card",
        description: "Fundo dos cards e painéis",
      },
      {
        key: "border_color",
        label: "Borda",
        description: "Bordas e divisores",
      },
      {
        key: "muted_color",
        label: "Muted",
        description: "Fundos suaves e inputs",
      },
      {
        key: "accent_color",
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
        key: "foreground_color",
        label: "Texto",
        description: "Texto principal",
      },
      {
        key: "card_foreground",
        label: "Texto card",
        description: "Texto dentro de cards",
      },
      {
        key: "muted_foreground",
        label: "Texto muted",
        description: "Textos secundários",
      },
      {
        key: "accent_foreground",
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
        key: "dark_primary_color",
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
        key: "dark_background_color",
        label: "Fundo",
        description: "Fundo principal",
      },
      { key: "dark_card_color", label: "Card", description: "Fundo dos cards" },
      {
        key: "dark_border_color",
        label: "Borda",
        description: "Bordas e divisores",
      },
      { key: "dark_muted_color", label: "Muted", description: "Fundos suaves" },
      {
        key: "dark_accent_color",
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
        key: "dark_foreground_color",
        label: "Texto",
        description: "Texto principal",
      },
      {
        key: "dark_card_foreground",
        label: "Texto card",
        description: "Texto em cards",
      },
      {
        key: "dark_muted_foreground",
        label: "Texto muted",
        description: "Textos secundários",
      },
      {
        key: "dark_accent_foreground",
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
    l * 100
  )}%`;
}

function applyThemeToDOM(theme: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary_color);
  root.style.setProperty("--primary-foreground", theme.primary_foreground);
  root.style.setProperty("--background", theme.background_color);
  root.style.setProperty("--foreground", theme.foreground_color);
  root.style.setProperty("--card", theme.card_color);
  root.style.setProperty("--card-foreground", theme.card_foreground);
  root.style.setProperty("--border", theme.border_color);
  root.style.setProperty("--input", theme.border_color);
  root.style.setProperty("--muted", theme.muted_color);
  root.style.setProperty("--muted-foreground", theme.muted_foreground);
  root.style.setProperty("--accent", theme.accent_color);
  root.style.setProperty("--accent-foreground", theme.accent_foreground);
  root.style.setProperty("--destructive", theme.destructive_color);
  root.style.setProperty("--success", theme.success_color);
  root.style.setProperty("--warning", theme.warning_color);
  root.style.setProperty("--ring", theme.primary_color);
  root.style.setProperty("--sidebar-primary", theme.primary_color);
  root.style.setProperty("--sidebar-ring", theme.primary_color);
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
  theme: ThemeColors;
  mode: "light" | "dark";
}) {
  const bg =
    mode === "light" ? theme.background_color : theme.dark_background_color;
  const fg =
    mode === "light" ? theme.foreground_color : theme.dark_foreground_color;
  const card = mode === "light" ? theme.card_color : theme.dark_card_color;
  const cardFg =
    mode === "light" ? theme.card_foreground : theme.dark_card_foreground;
  const border =
    mode === "light" ? theme.border_color : theme.dark_border_color;
  const muted =
    mode === "light" ? theme.muted_foreground : theme.dark_muted_foreground;
  const primary =
    mode === "light" ? theme.primary_color : theme.dark_primary_color;
  const mutedBg = mode === "light" ? theme.muted_color : theme.dark_muted_color;

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
              style={{ color: `hsl(${theme.primary_foreground})` }}
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
            color: `hsl(${theme.primary_foreground})`,
          }}
        >
          Primário
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${theme.success_color})`,
            color: "white",
          }}
        >
          Sucesso
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${theme.warning_color})`,
            color: "white",
          }}
        >
          Alerta
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
          style={{
            backgroundColor: `hsl(${theme.destructive_color})`,
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
              style={{ color: `hsl(${theme.success_color})` }}
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
              style={{ color: `hsl(${theme.warning_color})` }}
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
            color: `hsl(${theme.primary_foreground})`,
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
            statusColor: theme.success_color,
          },
          {
            name: "Maria Santos",
            amount: "R$ 245,00",
            status: "Pendente",
            statusColor: theme.warning_color,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeColors | null>(null);
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    supabase
      .from("gateway_theme")
      .select("*")
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Erro ao carregar tema");
        } else if (data && data.length > 0) {
          setTheme(data[0] as unknown as ThemeColors);
        }
        setLoading(false);
      });
  }, []);

  const updateColor = useCallback(
    (key: string, hex: string) => {
      if (!theme) return;
      const hsl = hexToHsl(hex);
      const updated = { ...theme, [key]: hsl };
      setTheme(updated);
      if (!key.startsWith("dark_")) applyThemeToDOM(updated);
    },
    [theme]
  );

  const handleSave = async () => {
    if (!theme) return;
    setSaving(true);
    const { id, ...rest } = theme;
    const { error } = await supabase
      .from("gateway_theme")
      .update(rest)
      .eq("id", id);
    if (error) toast.error("Erro ao salvar tema");
    else toast.success("Tema salvo com sucesso!");
    setSaving(false);
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

  if (loading) {
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
                : "text-muted-foreground hover:text-foreground"
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
                : "text-muted-foreground hover:text-foreground"
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
