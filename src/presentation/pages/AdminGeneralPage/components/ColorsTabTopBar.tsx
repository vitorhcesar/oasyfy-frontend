import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { Loader2, Moon, RotateCcw, Save, Sun } from "lucide-react";
import { toast } from "sonner";
import { useColorsTabStore } from "../stores/colors-tab.store";
import { applyThemeToDOM } from "../utils/apply-theme-to-dom";

interface IColorsTabTopBarProps {
  invalidateGatewayThemeQuery: () => Promise<void>;
}

export default function ColorsTabTopBar({
  invalidateGatewayThemeQuery,
}: IColorsTabTopBarProps) {
  const apiService = useApiService();

  const { mode, setMode, saving, setSaving, resetTheme, theme } =
    useColorsTabStore();

  const handleReset = () => {
    const updated = resetTheme();
    if (!updated) return;

    applyThemeToDOM(updated);
    toast.info("Cores restauradas para o padrão");
  };

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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="liquid-glass-control flex items-center gap-0.5 rounded-2xl p-1">
        <button
          type="button"
          onClick={() => setMode("light")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
            mode === "light"
              ? "bg-white text-[#0F0617] shadow-sm"
              : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
          )}
        >
          <Sun size={14} /> Claro
        </button>
        <button
          type="button"
          onClick={() => setMode("dark")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
            mode === "dark"
              ? "bg-white text-[#0F0617] shadow-sm"
              : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
          )}
        >
          <Moon size={14} /> Escuro
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 px-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <RotateCcw size={14} /> Restaurar
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Salvar
        </button>
      </div>
    </div>
  );
}
