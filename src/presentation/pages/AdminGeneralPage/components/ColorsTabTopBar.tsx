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
  );
}
