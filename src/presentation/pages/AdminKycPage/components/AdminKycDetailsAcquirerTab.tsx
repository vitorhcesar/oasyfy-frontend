import {
  acquirerSourceLabel,
  type IAcquirerPreferenceResponseDto,
} from "@/infra/http/services/api/modules/types/acquirer-preference.types";
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
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PLATFORM_DEFAULT_VALUE = "__platform_default__";

interface IAdminKycDetailsAcquirerTabProps {
  sellerId: number;
}

export function AdminKycDetailsAcquirerTab({
  sellerId,
}: IAdminKycDetailsAcquirerTabProps) {
  const apiService = useApiService();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<IAcquirerPreferenceResponseDto | null>(
    null,
  );
  const [selected, setSelected] = useState(PLATFORM_DEFAULT_VALUE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data =
          await apiService.modules.adminSellers.getSellerAcquirerPreference(
            sellerId,
          );
        if (cancelled) return;
        setDetail(data);
        setSelected(
          data.preference.acquirerId != null
            ? String(data.preference.acquirerId)
            : PLATFORM_DEFAULT_VALUE,
        );
      } catch (err) {
        toast.error(
          getErrorMessageOrDefault(err, "Erro ao carregar preferência"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiService, sellerId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const acquirerId =
        selected === PLATFORM_DEFAULT_VALUE ? null : Number(selected);
      const updated =
        await apiService.modules.adminSellers.updateSellerAcquirerPreference(
          sellerId,
          acquirerId,
        );
      setDetail(updated);
      toast.success("Preferência do seller atualizada");
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(err, "Erro ao salvar preferência do seller"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="admin-surface p-5 md:p-6">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar a preferência de adquirente deste seller.
        </p>
      </div>
    );
  }

  const effectiveName = detail.effective.name;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="admin-surface space-y-5 p-5 md:p-6">
        <div className="mb-1 flex items-center gap-2">
          <CreditCard size={16} className="text-primary" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Adquirente
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Efetiva
          </p>
          <div className="mt-2 flex items-center gap-3">
            {effectiveName ? (
              <AcquirerBrandLogo
                connection={{
                  api_url: "",
                  name: effectiveName,
                  logo_key: effectiveName.toLowerCase(),
                }}
                className="h-8 w-8"
                imageClassName="h-8 w-8 object-contain"
              />
            ) : null}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {effectiveName ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {acquirerSourceLabel(detail.effective.source)}
              </p>
            </div>
          </div>
          {detail.preference.acquirerId != null ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Preferência individual:{" "}
              {detail.availableAcquirers.find(
                (acq) => acq.id === detail.preference.acquirerId,
              )?.name ?? `#${detail.preference.acquirerId}`}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Sem preferência individual (herda o padrão)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Definir adquirente
          </label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PLATFORM_DEFAULT_VALUE}>
                Usar padrão da plataforma
                {detail.platformDefault?.name
                  ? ` (${detail.platformDefault.name})`
                  : ""}
              </SelectItem>
              {detail.availableAcquirers.map((acq) => (
                <SelectItem key={acq.id} value={String(acq.id)}>
                  {acq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="h-10 w-full gap-2 bg-white text-sm font-semibold text-[#111827] hover:bg-white/90"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Salvar
        </Button>
      </div>
    </div>
  );
}
