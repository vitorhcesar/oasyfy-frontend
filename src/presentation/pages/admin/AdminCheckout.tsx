import PageHeader from "@/presentation/components/PageHeader";
import useAdminCheckoutSettingsQuery from "@/presentation/hooks/use-admin-checkout-settings-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { CheckCircle2, Loader2, RadioTower, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminCheckout() {
  const apiService = useApiService();
  const { data, isLoading, invalidateQuery } = useAdminCheckoutSettingsQuery();

  const [baseUrl, setBaseUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [showStatusToSellers, setShowStatusToSellers] = useState(false);
  const [healthMessage, setHealthMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastStatus, setLastStatus] = useState<"unknown" | "up" | "down">(
    "unknown",
  );
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [effectiveBaseUrl, setEffectiveBaseUrl] = useState("");
  const [portalFrontendUrl, setPortalFrontendUrl] = useState("");

  useEffect(() => {
    if (!data) return;
    setBaseUrl(data.baseUrl ?? "");
    setIsEnabled(data.isEnabled);
    setShowStatusToSellers(data.showStatusToSellers);
    setHealthMessage(data.healthMessage ?? "");
    setLastStatus(data.lastHealthStatus);
    setLastCheckedAt(data.lastHealthCheckedAt);
    setEffectiveBaseUrl(data.effectiveBaseUrl);
    setPortalFrontendUrl(data.portalFrontendUrl);
  }, [data]);

  const inputClass =
    "w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const labelClass =
    "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block";

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await apiService.modules.adminConfig.updateCheckoutSettings({
        baseUrl: baseUrl.trim(),
        isEnabled,
        showStatusToSellers,
        healthMessage: healthMessage.trim(),
      });
      setBaseUrl(saved.baseUrl);
      setIsEnabled(saved.isEnabled);
      setShowStatusToSellers(saved.showStatusToSellers);
      setHealthMessage(saved.healthMessage);
      setLastStatus(saved.lastHealthStatus);
      setLastCheckedAt(saved.lastHealthCheckedAt);
      setEffectiveBaseUrl(saved.effectiveBaseUrl);
      setPortalFrontendUrl(saved.portalFrontendUrl);
      toast.success("Configurações salvas");
      await invalidateQuery();
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Erro ao salvar"));
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await apiService.modules.adminConfig.testCheckoutDomain(
        baseUrl.trim() || null,
      );
      setLastStatus(result.status);
      setLastCheckedAt(result.checkedAt);
      if (result.settings) {
        setEffectiveBaseUrl(result.settings.effectiveBaseUrl);
      }
      if (result.ok) {
        toast.success(`Domínio online (${result.latencyMs}ms)`);
      } else {
        toast.error(result.detail || "Domínio indisponível");
      }
      await invalidateQuery();
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Falha no teste"));
    }
    setTesting(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Configurações"
          title="Checkout"
          description="Domínio público dos links de pagamento e status do serviço."
        />

        <div className="space-y-5 rounded-2xl border border-border/70 bg-background/40 p-5">
          <div>
            <label className={labelClass}>URL base do checkout</label>
            <input
              className={inputClass}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://pay.oasyfy.com"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Deve ser diferente do portal em produção. Efetiva agora:{" "}
              <span className="font-medium text-foreground">
                {effectiveBaseUrl || "—"}
              </span>
              {portalFrontendUrl ? (
                <>
                  {" "}
                  · Portal:{" "}
                  <span className="font-medium text-foreground">
                    {portalFrontendUrl}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Checkout habilitado
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={showStatusToSellers}
              onChange={(e) => setShowStatusToSellers(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Mostrar status para sellers
          </label>

          <div>
            <label className={labelClass}>
              Mensagem quando indisponível
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={healthMessage}
              onChange={(e) => setHealthMessage(e.target.value)}
              placeholder="Estamos em manutenção. Tente mais tarde."
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {lastStatus === "up" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : lastStatus === "down" ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <RadioTower className="h-4 w-4 text-muted-foreground" />
              )}
              Último status:{" "}
              {lastStatus === "up"
                ? "Online"
                : lastStatus === "down"
                  ? "Indisponível"
                  : "Não verificado"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {lastCheckedAt
                ? `Verificado em ${new Date(lastCheckedAt).toLocaleString("pt-BR")}`
                : "Ainda não houve teste de domínio"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RadioTower className="mr-2 h-4 w-4" />
              )}
              Testar domínio
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Inclua a origem do checkout em{" "}
            <code className="rounded bg-muted px-1">ALLOWED_ORIGINS</code> e
            configure DNS/TLS do host de pagamento.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
