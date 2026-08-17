import { acquirerSourceLabel } from "@/infra/http/services/api/modules/types/acquirer-preference.types";
import { AcquirerBrandLogo } from "@/presentation/components/admin/AcquirerBrandLogo";
import { Button } from "@/presentation/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerAcquirerPreferenceQuery from "@/presentation/hooks/use-seller-acquirer-preference-query";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { translateError } from "@/presentation/utils/translate-error";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PLATFORM_DEFAULT_VALUE = "__platform_default__";

export function SellerAcquirersTab() {
  const apiService = useApiService();
  const { data, isLoading, isError, invalidateQuery, setCached } =
    useSellerAcquirerPreferenceQuery();
  const [selected, setSelected] = useState<string>(PLATFORM_DEFAULT_VALUE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSelected(
      data.preference.acquirerId != null
        ? String(data.preference.acquirerId)
        : PLATFORM_DEFAULT_VALUE,
    );
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const acquirerId =
        selected === PLATFORM_DEFAULT_VALUE ? null : Number(selected);
      const updated =
        await apiService.modules.sellerAcquirer.updatePreference(acquirerId);
      setCached(updated);
      await invalidateQuery();
      toast.success("Preferência de adquirente salva");
    } catch (err) {
      toast.error(
        translateError(
          getErrorMessageOrDefault(err, "Erro ao salvar preferência"),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="admin-surface p-6 sm:p-8">
        <p className="text-sm text-destructive">
          Não foi possível carregar as adquirentes. Tente novamente.
        </p>
      </div>
    );
  }

  const preferenceUnavailable = Boolean(data.effective.preferenceUnavailable);
  const platformDefaultLabel = data.platformDefault?.name
    ? `Usar padrão da plataforma (${data.platformDefault.name})`
    : "Usar padrão da plataforma";

  return (
    <div className="admin-surface p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Adquirentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha a adquirente preferida para novas cobranças e saques PIX. Se a
          opção ficar indisponível, o sistema usa o roteamento automático.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Configuração efetiva
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {data.effective.acquirerId != null ? (
            <AcquirerBrandLogo
              connection={{
                api_url: "",
                name: data.effective.name ?? "Adquirente",
                logo_key:
                  data.availableAcquirers.find(
                    (a) => a.id === data.effective.acquirerId,
                  )?.logoKey ??
                  data.effective.name?.toLowerCase() ??
                  null,
              }}
              className="h-8 w-8"
            />
          ) : null}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {data.effective.name ?? "Nenhuma adquirente disponível"}
            </p>
            <p className="text-xs text-muted-foreground">
              {acquirerSourceLabel(data.effective.source)}
            </p>
          </div>
        </div>
      </div>

      {preferenceUnavailable ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Sua preferência salva está indisponível. O sistema está usando
            fallback até você escolher outra adquirente.
          </span>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Preferência</label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue placeholder="Selecione uma adquirente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PLATFORM_DEFAULT_VALUE}>
              {platformDefaultLabel}
            </SelectItem>
            {data.availableAcquirers.map((acq) => (
              <SelectItem key={acq.id} value={String(acq.id)}>
                {acq.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5 !mt-2"
      >
        {saving ? <Loader2 className="animate-spin" /> : <Save />}
        Salvar preferência
      </Button>
    </div>
  );
}
