import { AcquirerBrandLogo } from "@/presentation/components/admin/AcquirerBrandLogo";
import { Button } from "@/presentation/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import useAdminAcquirerPreferenceQuery from "@/presentation/hooks/use-admin-acquirer-preference-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CLEAR_VALUE = "__clear__";

export function AdminPlatformDefaultAcquirerSection() {
  const apiService = useApiService();
  const { data, isLoading, isError, invalidateQuery, setCached } =
    useAdminAcquirerPreferenceQuery();
  const [selected, setSelected] = useState<string>(CLEAR_VALUE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSelected(
      data.platformDefault.acquirerId != null
        ? String(data.platformDefault.acquirerId)
        : CLEAR_VALUE,
    );
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const defaultAcquirerId =
        selected === CLEAR_VALUE ? null : Number(selected);
      const updated =
        await apiService.modules.adminSellers.updatePlatformDefaultAcquirer(
          defaultAcquirerId,
        );
      setCached(updated);
      await invalidateQuery();
      toast.success("Adquirente padrão da plataforma atualizada");
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(err, "Erro ao salvar adquirente padrão"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-surface mb-6 flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="admin-surface mb-6 p-5">
        <p className="text-sm text-destructive">
          Não foi possível carregar a preferência padrão.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-surface mb-6 space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Adquirente padrão da plataforma
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Usada por sellers sem preferência individual. Não altera quem já
          definiu uma adquirente própria.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {data.platformDefault.acquirerId != null ? (
          <AcquirerBrandLogo
            connection={{
              api_url: "",
              name: data.platformDefault.name ?? "Adquirente",
              logo_key:
                data.availableAcquirers.find(
                  (a) => a.id === data.platformDefault.acquirerId,
                )?.logoKey ??
                data.platformDefault.name?.toLowerCase() ??
                null,
            }}
            className="h-7 w-7"
          />
        ) : null}
        <div>
          <p className="font-medium text-foreground">
            {data.platformDefault.name ?? "Nenhum padrão definido"}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.platformDefault.updatedAt
              ? `Atualizado em ${new Date(
                  data.platformDefault.updatedAt,
                ).toLocaleString("pt-BR")}`
              : "Sem alterações registradas"}
            {" · "}
            {data.usage.sellersUsingDefault} sellers no padrão ·{" "}
            {data.usage.sellersWithPreference} com preferência
          </p>
        </div>
      </div>

      {!data.platformDefault.isEligible &&
      data.platformDefault.acquirerId != null ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            O padrão salvo está indisponível. O runtime usará roteamento/fallback
            até você definir outra adquirente elegível.
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Selecionar</label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>
                Sem padrão (usar roteamento)
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
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-white text-[#111827] hover:bg-white/90"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Salvar padrão
        </Button>
      </div>
    </div>
  );
}
