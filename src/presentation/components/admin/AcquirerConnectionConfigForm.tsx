import type { TAcquirerConnectionView } from "@/presentation/hooks/use-admin-acquirer-connections-query";
import type {
  IOnlyUpVerifyCredentialsDto,
  TOnlyUpCredentialCheckDto,
} from "@/infra/http/services/api/modules/admin-config.module";
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
  isOnzPixAcquirer,
  ONZ_CASH_IN_API,
  ONZ_CASH_OUT_API,
} from "@/presentation/utils/pix-acquirer-provider";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  MinusCircle,
  Settings2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const DEFAULT_WOOVI_API = "https://api.woovi-sandbox.com";

const ONLYUP_VERIFY_CHECKS: Array<{
  key: keyof Omit<IOnlyUpVerifyCredentialsDto, "ok">;
  label: string;
}> = [
  { key: "cash_in_oauth", label: "OAuth + mTLS (API Pix)" },
  { key: "cash_in_api", label: "API Pix (GET /cob)" },
  { key: "pix_key", label: "Chave Pix" },
  { key: "cash_out_oauth", label: "OAuth + mTLS (API Conta)" },
  { key: "cash_out_balance", label: "Saldo da API Conta" },
];

function OnlyUpCheckRow({
  label,
  check,
}: {
  label: string;
  check: TOnlyUpCredentialCheckDto;
}) {
  const Icon = check.skipped ? MinusCircle : check.ok ? CheckCircle2 : XCircle;
  const color = check.skipped
    ? "text-muted-foreground"
    : check.ok
      ? "text-success"
      : "text-destructive";
  return (
    <li className="flex gap-2 text-sm">
      <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-muted-foreground">{check.detail}</p>
      </div>
    </li>
  );
}

interface IAcquirerConnectionConfigFormProps {
  connection: TAcquirerConnectionView;
  saving: boolean;
  registeringWebhook?: boolean;
  registeringCashOutWebhook?: boolean;
  verifyingCredentials?: boolean;
  credentialCheck?: IOnlyUpVerifyCredentialsDto | null;
  onSave: (
    connectionId: number,
    payload: IAcquirerCredentialsForm & {
      status: string;
      isActive: boolean;
    },
  ) => Promise<void>;
  onRegisterWebhook?: () => Promise<void>;
  onRegisterCashOutWebhook?: () => Promise<void>;
  onVerifyCredentials?: () => Promise<void>;
}

export function AcquirerConnectionConfigForm({
  connection,
  saving,
  registeringWebhook = false,
  registeringCashOutWebhook = false,
  verifyingCredentials = false,
  credentialCheck = null,
  onSave,
  onRegisterWebhook,
  onRegisterCashOutWebhook,
  onVerifyCredentials,
}: IAcquirerConnectionConfigFormProps) {
  const [showToken, setShowToken] = useState(false);
  const [showHmac, setShowHmac] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPfxPassword, setShowPfxPassword] = useState(false);
  const [showCashOutSecret, setShowCashOutSecret] = useState(false);
  const [showCashOutPfxPassword, setShowCashOutPfxPassword] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [formData, setFormData] = useState<IAcquirerCredentialsForm>({
    apiUrl: "",
    clientId: "",
    accessToken: "",
    hmacKey: "",
    branchId: "",
    accountNumber: "",
    cashInClientSecret: "",
    cashInPfx: "",
    cashInPfxPassword: "",
    pixKey: "",
    cashOutClientId: "",
    cashOutClientSecret: "",
    cashOutPfx: "",
    cashOutPfxPassword: "",
    cashOutApiUrl: ONZ_CASH_OUT_API.onlyup,
  });

  const provider = useMemo(
    () => inferPixAcquirerProvider(connection),
    [connection],
  );

  const isOnz = isOnzPixAcquirer(provider);
  const configured = isAcquirerConfigured(connection);
  const apiBase = getApiBaseUrl();
  const webhookUrl = isOnz
    ? `${apiBase}/api/v1/webhooks/${provider}/pix`
    : `${apiBase}/api/v1/webhooks/woovi/pix`;
  const cashOutAlias = provider === "basspago" ? "bass_pago" : "only_up";

  useEffect(() => {
    setFormData(buildAcquirerFormFromConnection(connection, configured));
    setShowToken(false);
    setShowHmac(false);
    setReconfiguring(false);
  }, [connection, configured]);

  const handleSave = async () => {
    const hasCredentials = hasAcquirerCredentialsToSave(
      provider,
      formData,
      configured,
    );
    await onSave(Number(connection.id), {
      ...formData,
      status: hasCredentials ? "connected" : "disconnected",
      isActive: hasCredentials,
    });
    setReconfiguring(false);
  };

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
              : `A Oasyfy registra esta URL na ${getPixAcquirerProviderLabel(provider)} (PUT /webhook/{chave}). Quem tiver a URL pode simular POST — o pagamento só é confirmado com GET /cob.`}
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

        {isOnz && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cash-in não usa HMAC. Alias legado:{" "}
              <code className="text-foreground">
                {apiBase}/api/v1/gateway/webhook/{cashOutAlias}
              </code>
              .
            </p>
            {onRegisterWebhook && (
              <button
                type="button"
                onClick={() => {
                  void onRegisterWebhook();
                }}
                disabled={registeringWebhook || !configured}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {registeringWebhook && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                Configurar webhook
              </button>
            )}
            {onRegisterCashOutWebhook && (
              <button
                type="button"
                onClick={() => {
                  void onRegisterCashOutWebhook();
                }}
                disabled={
                  registeringCashOutWebhook ||
                  !connection.onlyup?.has_cash_out_pfx
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {registeringCashOutWebhook && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                Configurar webhooks da API Conta
              </button>
            )}
            {onRegisterCashOutWebhook && (
              <p className="text-sm text-muted-foreground">
                Cadastra na {getPixAcquirerProviderLabel(provider)} os 5
                webhooks da API Conta (transferência, recebimento, estorno, fila
                de saída e infrações) apontando para esta Oasyfy.
              </p>
            )}
          </div>
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
            {onVerifyCredentials && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    void onVerifyCredentials();
                  }}
                  disabled={verifyingCredentials}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
                >
                  {verifyingCredentials ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  Verificar credenciais
                </button>
                {credentialCheck && (
                  <ul className="space-y-2 rounded-xl border border-border/50 bg-background/40 p-3">
                    {ONLYUP_VERIFY_CHECKS.map((item) => (
                      <OnlyUpCheckRow
                        key={item.key}
                        label={item.label}
                        check={credentialCheck[item.key]}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
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
                  isOnz ? ONZ_CASH_IN_API[provider] : DEFAULT_WOOVI_API
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
              {isOnz && (
                <p className="text-sm text-muted-foreground">
                  Cash-in: <code>{ONZ_CASH_IN_API[provider]}</code> (sem
                  sandbox público).
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
            ) : isOnz ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Client ID (API Pix / cash-in)</Label>
                  <Input
                    placeholder="Client ID da aba API QRCODES"
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
                  <Label className="text-sm">Client Secret</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      placeholder={
                        configured
                          ? "Deixe em branco para manter o secret atual"
                          : "Client Secret OAuth"
                      }
                      value={formData.cashInClientSecret}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cashInClientSecret: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Certificado PFX</Label>
                  <Input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result;
                        if (typeof result !== "string") {
                          return;
                        }
                        const base64 = result.includes(",")
                          ? result.slice(result.indexOf(",") + 1)
                          : result;
                        setFormData((prev) => ({ ...prev, cashInPfx: base64 }));
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.cashInPfx
                      ? "Novo certificado selecionado."
                      : connection.onlyup?.has_cash_in_pfx
                        ? "Certificado já carregado. Envie outro arquivo só se quiser substituir."
                        : "Arquivo .pfx da API QRCODES (mTLS)."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Senha do PFX</Label>
                  <div className="relative">
                    <Input
                      type={showPfxPassword ? "text" : "password"}
                      placeholder={
                        configured
                          ? "Deixe em branco para manter a senha atual"
                          : "Senha do certificado"
                      }
                      value={formData.cashInPfxPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cashInPfxPassword: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPfxPassword(!showPfxPassword)}
                    >
                      {showPfxPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Chave Pix</Label>
                  <Input
                    placeholder="Chave DICT recebedora"
                    value={formData.pixKey}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pixKey: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      API Conta (cash-out)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Credenciais da aba Finance → API CONTAS. Outro certificado
                      mTLS — não reutilize o PFX do cash-in. Opcional: sem este
                      bloco, saques fazem failover para a Woovi.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">URL da API Conta</Label>
                    <Input
                      placeholder={ONZ_CASH_OUT_API[provider]}
                      value={formData.cashOutApiUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cashOutApiUrl: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Client ID (API Contas)</Label>
                    <Input
                      placeholder="Client ID da aba API CONTAS"
                      value={formData.cashOutClientId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          cashOutClientId: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Client Secret (API Contas)</Label>
                    <div className="relative">
                      <Input
                        type={showCashOutSecret ? "text" : "password"}
                        placeholder={
                          connection.onlyup?.has_cash_out_client_secret
                            ? "Deixe em branco para manter o secret atual"
                            : "Client Secret OAuth cash-out"
                        }
                        value={formData.cashOutClientSecret}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cashOutClientSecret: e.target.value,
                          }))
                        }
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCashOutSecret(!showCashOutSecret)}
                      >
                        {showCashOutSecret ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Certificado PFX (cash-out)</Label>
                    <Input
                      type="file"
                      accept=".pfx,.p12"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result;
                          if (typeof result !== "string") {
                            return;
                          }
                          const base64 = result.includes(",")
                            ? result.slice(result.indexOf(",") + 1)
                            : result;
                          setFormData((prev) => ({
                            ...prev,
                            cashOutPfx: base64,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.cashOutPfx
                        ? "Novo certificado selecionado."
                        : connection.onlyup?.has_cash_out_pfx
                          ? "Certificado já carregado. Envie outro arquivo só se quiser substituir."
                          : "Arquivo .pfx da API CONTAS (mTLS)."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Senha do PFX (cash-out)</Label>
                    <div className="relative">
                      <Input
                        type={showCashOutPfxPassword ? "text" : "password"}
                        placeholder={
                          connection.onlyup?.has_cash_out_pfx_password
                            ? "Deixe em branco para manter a senha atual"
                            : "Senha do certificado cash-out"
                        }
                        value={formData.cashOutPfxPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cashOutPfxPassword: e.target.value,
                          }))
                        }
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setShowCashOutPfxPassword(!showCashOutPfxPassword)
                        }
                      >
                        {showCashOutPfxPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

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
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
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
