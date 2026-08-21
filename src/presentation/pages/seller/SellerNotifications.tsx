import PageHeader from "@/presentation/components/PageHeader";
import { PwaInstallGuide } from "@/presentation/components/seller/PwaInstallGuide";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Button } from "@/presentation/components/ui/button";
import { Switch } from "@/presentation/components/ui/switch";
import { useApiService } from "@/presentation/hooks/use-api-service";
import {
  detectPwaInstallContext,
  getDefaultPwaInstallContext,
  type TPwaInstallContext,
} from "@/presentation/utils/detect-pwa-install-context";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type TPermissionState = NotificationPermission | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SellerNotifications() {
  const apiService = useApiService();
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [permission, setPermission] = useState<TPermissionState>("default");
  const [sale, setSale] = useState(true);
  const [refund, setRefund] = useState(true);
  const [withdrawal, setWithdrawal] = useState(true);
  const [hasLocalSubscription, setHasLocalSubscription] = useState(false);
  const [testingType, setTestingType] = useState<string | null>(null);
  const [installContext, setInstallContext] = useState<TPwaInstallContext>(
    getDefaultPwaInstallContext,
  );
  const [contextReady, setContextReady] = useState(false);

  const unsupported = permission === "unsupported";

  const refreshLocalSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setHasLocalSubscription(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setHasLocalSubscription(Boolean(subscription));
    } catch {
      setHasLocalSubscription(false);
    }
  }, []);

  useEffect(() => {
    setInstallContext(detectPwaInstallContext());
    setContextReady(true);

    if (!("Notification" in window) || !("PushManager" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }

    let cancelled = false;
    (async () => {
      try {
        const prefs =
          await apiService.modules.sellerNotifications.getPreferences();
        if (cancelled) return;
        setSale(prefs.sale);
        setRefund(prefs.refund);
        setWithdrawal(prefs.withdrawal);
        await refreshLocalSubscription();
      } catch (err) {
        toast.error(
          getErrorMessageOrDefault(
            err,
            "Não foi possível carregar preferências",
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiService, refreshLocalSubscription]);

  const updatePreference = async (
    key: "sale" | "refund" | "withdrawal",
    value: boolean,
  ) => {
    setSavingType(key);
    const prev = { sale, refund, withdrawal };
    if (key === "sale") setSale(value);
    if (key === "refund") setRefund(value);
    if (key === "withdrawal") setWithdrawal(value);

    try {
      const updated =
        await apiService.modules.sellerNotifications.updatePreferences({
          [key]: value,
        });
      setSale(updated.sale);
      setRefund(updated.refund);
      setWithdrawal(updated.withdrawal);
    } catch (err) {
      setSale(prev.sale);
      setRefund(prev.refund);
      setWithdrawal(prev.withdrawal);
      toast.error(
        getErrorMessageOrDefault(err, "Não foi possível salvar preferência"),
      );
    } finally {
      setSavingType(null);
    }
  };

  const activateNotifications = async () => {
    if (unsupported) {
      toast.error("Este navegador não suporta notificações push");
      return;
    }

    setActivating(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Permissão de notificações negada");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        toast.error("Service Worker indisponível neste contexto");
        return;
      }

      const { publicKey } =
        await apiService.modules.sellerNotifications.getVapidPublicKey();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ) as BufferSource,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Subscription inválida");
      }

      await apiService.modules.sellerNotifications.upsertSubscription({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        userAgent: navigator.userAgent,
      });

      setHasLocalSubscription(true);
      toast.success("Notificações ativadas neste dispositivo");
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(err, "Não foi possível ativar notificações"),
      );
    } finally {
      setActivating(false);
    }
  };

  const sendTestNotification = async (
    key: "sale" | "refund" | "withdrawal",
  ) => {
    if (!hasLocalSubscription) {
      toast.error("Ative as notificações neste dispositivo primeiro");
      return;
    }

    setTestingType(key);
    try {
      const result =
        await apiService.modules.sellerNotifications.sendTest(key);
      toast.success(
        `Teste enviado para ${result.devices} dispositivo(s). ${result.remaining} restantes neste minuto.`,
      );
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(err, "Não foi possível enviar o teste"),
      );
    } finally {
      setTestingType(null);
    }
  };

  const deactivateOnDevice = async () => {
    setDeactivating(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiService.modules.sellerNotifications.revokeSubscription(
          subscription.endpoint,
        );
        await subscription.unsubscribe();
      }
      setHasLocalSubscription(false);
      toast.success("Notificações desativadas neste dispositivo");
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(
          err,
          "Não foi possível desativar neste dispositivo",
        ),
      );
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <SellerLayout>
      <div className="px-5 py-6 md:px-8">
        <PageHeader
          eyebrow="Conta"
          title="Notificações"
          description="Receba avisos de vendas, reembolsos e saques no celular ou desktop."
        />

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            {contextReady ? (
              <PwaInstallGuide context={installContext} />
            ) : null}

            <section className="rounded-2xl border border-white/10 bg-background/40 p-5 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
                  {permission === "granted" && hasLocalSubscription ? (
                    <Bell className="h-5 w-5" />
                  ) : (
                    <BellOff className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">
                    Este dispositivo
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {unsupported
                      ? "Notificações push não são suportadas neste navegador."
                      : permission === "denied"
                        ? "Permissão bloqueada. Reative nas configurações do sistema/navegador."
                        : permission === "granted" && hasLocalSubscription
                          ? "Notificações ativas neste dispositivo."
                          : "Ative para receber avisos mesmo com o portal fechado."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!unsupported && permission !== "denied" ? (
                      <Button
                        type="button"
                        onClick={activateNotifications}
                        disabled={activating}
                      >
                        {activating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {hasLocalSubscription
                          ? "Reativar neste dispositivo"
                          : "Ativar notificações"}
                      </Button>
                    ) : null}
                    {hasLocalSubscription ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={deactivateOnDevice}
                        disabled={deactivating}
                      >
                        {deactivating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Desativar neste dispositivo
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-background/40 p-5 backdrop-blur-md">
              <h2 className="text-base font-semibold text-foreground">
                Tipos de aviso
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Você pode salvar preferências mesmo sem permissão; o envio só
                ocorre com subscription ativa.
              </p>

              <div className="mt-4 space-y-3">
                {(
                  [
                    {
                      key: "sale" as const,
                      label: "Vendas",
                      description: "Quando um PIX de venda for confirmado.",
                      value: sale,
                    },
                    {
                      key: "refund" as const,
                      label: "Reembolsos",
                      description: "Quando um reembolso for concluído.",
                      value: refund,
                    },
                    {
                      key: "withdrawal" as const,
                      label: "Saques",
                      description:
                        "Quando um saque for concluído ou falhar de forma final.",
                      value: withdrawal,
                    },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestNotification(item.key)}
                        disabled={
                          testingType !== null || !hasLocalSubscription
                        }
                      >
                        {testingType === item.key ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Testar
                      </Button>
                      <Switch
                        checked={item.value}
                        disabled={savingType === item.key}
                        onCheckedChange={(checked) =>
                          updatePreference(item.key, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Os testes enviam um aviso de exemplo mesmo com o tipo
                desligado. Limite: 20 por minuto.
              </p>
            </section>

            <p className="text-xs text-muted-foreground">
              Não enviamos dados sensíveis do pagador; apenas valores e status.
              Login, API e pagamentos continuam exigindo internet.
            </p>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
