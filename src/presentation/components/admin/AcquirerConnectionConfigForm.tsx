import type { TAcquirerConnectionView } from "@/presentation/hooks/use-admin-acquirer-connections-query";
import { WOOVI_WEBHOOK_EVENTS } from "@/presentation/constants/woovi-webhook-events";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  buildAcquirerFormFromConnection,
  hasAcquirerCredentialsToSave,
  isAcquirerConfigured,
  type IAcquirerCredentialsForm,
} from "@/presentation/utils/acquirer-connection-config.util";
import { getApiBaseUrl } from "@/infra/http/services/api/api-env";
import {
  getPixAcquirerProviderLabel,
  inferPixAcquirerProvider,
} from "@/presentation/utils/pix-acquirer-provider";
import { Copy, Eye, EyeOff, ExternalLink, Loader2, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const DEFAULT_WOOVI_API = "https://api.woovi-sandbox.com";
const DEFAULT_CARTWAVE_API = "https://api.cartwavehub.com.br";

interface IAcquirerConnectionConfigFormProps {
  connection: TAcquirerConnectionView;
  saving: boolean;
  onSave: (
    connectionId: number,
    payload: IAcquirerCredentialsForm & {
      status: string;
      isActive: boolean;
    },
  ) => Promise<void>;
}

export function AcquirerConnectionConfigForm({
  connection,
  saving,
  onSave,
}: IAcquirerConnectionConfigFormProps) {
  const [showToken, setShowToken] = useState(false);
  const [showHmac, setShowHmac] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [formData, setFormData] = useState<IAcquirerCredentialsForm>({
    apiUrl: "",
    clientId: "",
    accessToken: "",
    hmacKey: "",
    branchId: "",
    accountNumber: "",
  });

  const provider = useMemo(
    () => inferPixAcquirerProvider(connection),
    [connection],
  );

  const configured = isAcquirerConfigured(connection);
  const apiBase = getApiBaseUrl();
  const webhookUrl =
    provider === "woovi"
      ? `${apiBase}/api/v1/webhooks/woovi/pix`
      : `${apiBase}/api/v1/webhooks/cartwave/pix`;

  useEffect(() => {
    setFormData(buildAcquirerFormFromConnection(connection, configured));
    setShowToken(false);
    setShowHmac(false);
    setReconfiguring(false);
  }, [connection, configured]);

  const handleSave = async () => {
    const hasCredentials = hasAcquirerCredentialsToSave(provider, formData);
    await onSave(Number(connection.id), {
      ...formData,
      status: hasCredentials ? "connected" : "disconnected",
      isActive: hasCredentials,
    });
    setReconfiguring(false);
  };

  const showForm = !configured || reconfiguring;

  return (
    <div className="space-y-6">
      <div className="admin-surface space-y-4 p-5 md:p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Webhook de {getPixAcquirerProviderLabel(provider)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {provider === "woovi"
              ? "Cadastre esta URL no painel Woovi (um webhook por evento). Use o mesmo valor de Authorization do webhook no campo Secret abaixo."
              : "Cadastre esta URL no painel Cartwave para notificações de pagamento PIX."}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
          <ExternalLink size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <code className="flex-1 break-all font-mono text-sm text-foreground">
            {webhookUrl}
          </code>
          <button
            type="button"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              toast.success("URL do webhook copiada");
            }}
          >
            <Copy size={15} />
          </button>
        </div>

        {provider === "woovi" && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {WOOVI_WEBHOOK_EVENTS.map((item) => (
              <li key={item.event}>
                <code className="text-foreground">{item.event}</code> —{" "}
                {item.description}
              </li>
            ))}
          </ul>
        )}

        {provider === "cartwave" && (
          <p className="text-sm text-muted-foreground">
            Evento principal:{" "}
            <code className="text-foreground">QR_CODE_COPY_AND_PASTE_PAID</code>.
            A Cartwave envia headers <code>ci</code> e <code>hmac</code> para
            validação.
          </p>
        )}
      </div>

      <div className="admin-surface space-y-5 p-5 md:p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Credenciais da API
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os dados fornecidos pelo painel{" "}
            {getPixAcquirerProviderLabel(provider)}.
          </p>
        </div>

        {configured && !reconfiguring ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/25 bg-success/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-sm font-semibold text-foreground">
                  Credenciais configuradas
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                API: <code className="text-foreground">{connection.api_url}</code>
              </p>
              <p className="text-sm text-muted-foreground">
                Por segurança, os secrets não são exibidos após salvar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReconfiguring(true)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/60 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto sm:px-4"
            >
              <Settings2 size={15} />
              Reconfigurar credenciais
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">URL da API</Label>
              <Input
                placeholder={
                  provider === "woovi" ? DEFAULT_WOOVI_API : DEFAULT_CARTWAVE_API
                }
                value={formData.apiUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiUrl: e.target.value }))
                }
                className="font-mono text-sm"
              />
              {provider === "woovi" && (
                <p className="text-sm text-muted-foreground">
                  Sandbox: <code>https://api.woovi-sandbox.com</code> — Produção:{" "}
                  <code>https://api.woovi.com</code>
                </p>
              )}
            </div>

            {provider === "woovi" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">App ID (Access Token)</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="App ID da Woovi"
                      value={formData.accessToken}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accessToken: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Secret do webhook (Authorization)
                  </Label>
                  <div className="relative">
                    <Input
                      type={showHmac ? "text" : "password"}
                      placeholder="Valor do header Authorization no webhook Woovi"
                      value={formData.hmacKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hmacKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowHmac(!showHmac)}
                    >
                      {showHmac ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Client ID (opcional — fallback do webhook)
                  </Label>
                  <Input
                    placeholder="Opcional"
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  Saques PIX Out exigem scope <code>PAYMENT_POST</code> no app
                  Woovi.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">ID do Cliente (Client ID)</Label>
                  <Input
                    placeholder="9E54779D..."
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Chave Secreta (Access Token)</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder="eyJhbGciOiJIUzI1NiIs..."
                      value={formData.accessToken}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accessToken: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Chave HMAC</Label>
                  <div className="relative">
                    <Input
                      type={showHmac ? "text" : "password"}
                      placeholder="57373705c83bc5efe..."
                      value={formData.hmacKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hmacKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowHmac(!showHmac)}
                    >
                      {showHmac ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Agência (Branch)</Label>
                    <Input
                      placeholder="0001"
                      value={formData.branchId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          branchId: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Nº da Conta</Label>
                    <Input
                      placeholder="401050"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {reconfiguring && (
                <button
                  type="button"
                  onClick={() => {
                    setReconfiguring(false);
                    setFormData(
                      buildAcquirerFormFromConnection(connection, configured),
                    );
                  }}
                  className="inline-flex h-10 items-center rounded-xl border border-border/60 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Salvar credenciais
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
