import { Switch } from "@/presentation/components/ui/switch";
import useAdminFinancialSettingsQuery from "@/presentation/hooks/use-admin-financial-settings-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function FinancialTab() {
  const apiService = useApiService();
  const { data, isLoading, invalidateQuery } = useAdminFinancialSettingsQuery();
  const [autoWithdrawalEnabled, setAutoWithdrawalEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setAutoWithdrawalEnabled(data.autoWithdrawalEnabled);
  }, [data]);

  const handleToggle = async (enabled: boolean) => {
    const previous = autoWithdrawalEnabled;
    setAutoWithdrawalEnabled(enabled);
    setSaving(true);
    try {
      const saved = await apiService.modules.adminConfig.updateFinancialSettings(
        { autoWithdrawalEnabled: enabled },
      );
      setAutoWithdrawalEnabled(saved.autoWithdrawalEnabled);
      toast.success(
        saved.autoWithdrawalEnabled
          ? "Saque automático habilitado"
          : "Saque automático desabilitado",
      );
      await invalidateQuery();
    } catch (err) {
      setAutoWithdrawalEnabled(previous);
      toast.error(getErrorMessageOrDefault(err, "Erro ao salvar"));
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Defina como os saques dos sellers são processados na plataforma.
      </p>

      <div className="admin-surface flex items-start justify-between gap-4 p-4 md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Wallet size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Saque automático
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {autoWithdrawalEnabled
                ? "Os saques são enviados ao adquirente na hora, sem confirmação na tela de Saques."
                : "Cada saque fica pendente até um administrador aprovar ou negar na tela de Saques."}
            </p>
          </div>
        </div>
        <Switch
          checked={autoWithdrawalEnabled}
          onCheckedChange={handleToggle}
          disabled={saving}
          aria-label="Habilitar saque automático"
        />
      </div>
    </div>
  );
}
