import { AcquirerBrandLogo } from "@/presentation/components/admin/AcquirerBrandLogo";
import { AcquirerConnectionConfigForm } from "@/presentation/components/admin/AcquirerConnectionConfigForm";
import type { IAcquirerCredentialsForm } from "@/presentation/utils/acquirer-connection-config.util";
import useAdminAcquirerConnectionsQuery from "@/presentation/hooks/use-admin-acquirer-connections-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { Switch } from "@/presentation/components/ui/switch";
import { cn } from "@/presentation/utils/cn";
import {
  getPixAcquirerProviderLabel,
  inferPixAcquirerProvider,
  isPixAcquirerProviderSlug,
} from "@/presentation/utils/pix-acquirer-provider";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function AdminAcquirerConnectionConfigPage() {
  const { provider: providerSlug } = useParams<{ provider: string }>();
  const apiService = useApiService();
  const {
    data: connections,
    isLoading,
    isError,
    invalidateQuery,
  } = useAdminAcquirerConnectionsQuery();
  const [saving, setSaving] = useState(false);

  const provider = isPixAcquirerProviderSlug(providerSlug)
    ? providerSlug
    : null;

  const connection = useMemo(() => {
    if (!provider) {
      return null;
    }
    return (
      connections.find((conn) => inferPixAcquirerProvider(conn) === provider) ??
      null
    );
  }, [connections, provider]);

  useEffect(() => {
    if (isError) {
      toast.error("Erro ao carregar adquirente");
    }
  }, [isError]);

  if (!provider) {
    return <Navigate to="/admin/acquirer?tab=conexoes" replace />;
  }

  const saveConfig = async (
    connectionId: number,
    payload: IAcquirerCredentialsForm & {
      status: string;
      isActive: boolean;
    },
  ) => {
    setSaving(true);

    try {
      await apiService.modules.adminConfig.updateAcquirerConnection(
        connectionId,
        {
          apiUrl: payload.apiUrl,
          clientId: payload.clientId,
          accessToken: payload.accessToken,
          hmacKey: payload.hmacKey,
          branchId: payload.branchId,
          accountNumber: payload.accountNumber,
          status: payload.status,
          isActive: payload.isActive,
        },
      );
      toast.success("Credenciais salvas com sucesso!");
      await invalidateQuery();
    } catch (error) {
      toast.error("Erro ao salvar credenciais");
      console.error(error);
    }

    setSaving(false);
  };

  const toggleActive = async () => {
    if (!connection) {
      return;
    }

    if (connection.status !== "connected") {
      toast.error("Configure as credenciais antes de ativar.");
      return;
    }

    const next = !connection.is_active;

    try {
      await apiService.modules.adminConfig.setAcquirerConnectionActive(
        Number(connection.id),
        next,
      );
      toast.success(
        next ? `${connection.name} ativada` : `${connection.name} desativada`,
      );
      await invalidateQuery();
    } catch (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8 md:py-9">
        <Link
          to="/admin/acquirer?tab=conexoes"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Voltar para conexões
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : !connection ? (
          <div className="admin-surface space-y-4 px-6 py-12 text-center">
            <p className="text-base font-semibold text-foreground">
              {getPixAcquirerProviderLabel(provider)} não encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Carregue as adquirentes padrão na aba Conexões antes de configurar.
            </p>
            <Link
              to="/admin/acquirer?tab=conexoes"
              className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90"
            >
              Ir para conexões
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in space-y-6">
            <header className="admin-surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
                <AcquirerBrandLogo
                  connection={connection}
                  imageClassName="h-16 w-16 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {connection.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
                      connection.status === "connected" &&
                        "border-success/25 bg-success/10 text-success",
                      connection.status === "error" &&
                        "border-destructive/25 bg-destructive/10 text-destructive",
                      connection.status !== "connected" &&
                        connection.status !== "error" &&
                        "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {connection.status === "connected"
                      ? "Conectada"
                      : connection.status === "error"
                        ? "Erro"
                        : "Desconectada"}
                  </span>
                </div>

                {connection.description ? (
                  <p className="text-sm text-muted-foreground">
                    {connection.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-1.5">
                  {connection.methods.map((method) => (
                    <span
                      key={method}
                      className="rounded-lg border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold uppercase text-foreground"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {connection.is_active ? "Ativa" : "Inativa"}
                </span>
                <Switch
                  checked={connection.is_active}
                  onCheckedChange={toggleActive}
                />
              </div>
            </header>

            <AcquirerConnectionConfigForm
              connection={connection}
              saving={saving}
              onSave={saveConfig}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
