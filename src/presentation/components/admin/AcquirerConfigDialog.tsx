import type { TAcquirerConnectionView } from "@/presentation/hooks/use-admin-acquirer-connections-query";
import { WOOVI_WEBHOOK_EVENTS } from "@/presentation/constants/woovi-webhook-events";
import { AcquirerBrandLogo } from "@/presentation/components/admin/AcquirerBrandLogo";
import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
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

interface IAcquirerConfigDialogProps {
  connection: TAcquirerConnectionView | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    connectionId: number,
    payload: IAcquirerCredentialsForm & {
      status: string;
      isActive: boolean;
    },
  ) => Promise<void>;
}

const DEFAULT_WOOVI_API = "https://api.woovi-sandbox.com";

export function AcquirerConfigDialog({
  connection,
  open,
  saving,
  onOpenChange,
  onSave,
}: IAcquirerConfigDialogProps) {
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
    () => (connection ? inferPixAcquirerProvider(connection) : "woovi"),
    [connection],
  );

  const configured = connection ? isAcquirerConfigured(connection) : false;
  const webhookUrl = `${getApiBaseUrl()}/api/v1/webhooks/woovi/pix`;

  useEffect(() => {
    if (!connection || !open) {
      return;
    }
    setFormData(buildAcquirerFormFromConnection(connection, configured));
    setShowToken(false);
    setShowHmac(false);
    setReconfiguring(false);
  }, [connection, configured, open]);

  if (!connection) {
    return null;
  }

  const handleSave = async () => {
    const hasCredentials = hasAcquirerCredentialsToSave(provider, formData);
    await onSave(Number(connection.id), {
      ...formData,
      status: hasCredentials ? "connected" : "disconnected",
      isActive: hasCredentials,
    });
  };

  const showForm = !configured || reconfiguring;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setReconfiguring(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AcquirerBrandLogo
              connection={connection}
              className="w-6 h-6"
              imageClassName="w-6 h-6 object-contain"
            />
            Configurar {connection.name}
            <span className="text-[10px] font-normal text-muted-foreground ml-1">
              ({getPixAcquirerProviderLabel(provider)})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {provider === "woovi" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <p className="text-xs text-foreground font-medium">
                Webhook Woovi / OpenPix
              </p>
              <p className="text-[11px] text-muted-foreground">
                Cadastre esta URL no painel Woovi (um webhook por evento). Use o
                mesmo valor de <strong>Authorization</strong> do webhook no campo
                &quot;Secret do webhook&quot; abaixo.
              </p>
              <div className="flex items-center gap-2 text-xs bg-background/80 rounded-md px-2 py-1.5 border border-border/40">
                <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                <code className="text-[10px] font-mono break-all flex-1">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.success("URL do webhook copiada");
                  }}
                >
                  <Copy size={12} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5">
                {WOOVI_WEBHOOK_EVENTS.map((item) => (
                  <li key={item.event}>
                    <code className="text-foreground">{item.event}</code> —{" "}
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {configured && !reconfiguring ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-foreground">
                    Credenciais configuradas
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  API: <code>{connection.api_url}</code>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Por segurança, os secrets não são exibidos após salvar.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => setReconfiguring(true)}
              >
                <Settings2 size={13} />
                Reconfigurar credenciais
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">URL da API</Label>
                <Input
                  placeholder={
                    provider === "woovi"
                      ? DEFAULT_WOOVI_API
                      : "https://api.cartwavehub.com.br"
                  }
                  value={formData.apiUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiUrl: e.target.value }))
                  }
                  className="text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Sandbox Woovi: <code>https://api.woovi-sandbox.com</code> —
                  Produção: <code>https://api.woovi.com</code>
                </p>
              </div>

              {provider === "woovi" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">App ID (Access Token)</Label>
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
                        className="pr-10 text-xs font-mono"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Secret do webhook (Authorization)</Label>
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
                        className="pr-10 text-xs font-mono"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowHmac(!showHmac)}
                      >
                        {showHmac ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">
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
                      className="text-xs font-mono"
                    />
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Saques PIX Out exigem scope <code>PAYMENT_POST</code> no app
                    Woovi.
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">ID do Cliente (Client ID)</Label>
                    <Input
                      placeholder="9E54779D..."
                      value={formData.clientId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          clientId: e.target.value,
                        }))
                      }
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave Secreta (Access Token)</Label>
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
                        className="pr-10 text-xs font-mono"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Chave HMAC</Label>
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
                        className="pr-10 text-xs font-mono"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowHmac(!showHmac)}
                      >
                        {showHmac ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Agência (Branch)</Label>
                      <Input
                        placeholder="0001"
                        value={formData.branchId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            branchId: e.target.value,
                          }))
                        }
                        className="text-xs font-mono"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nº da Conta</Label>
                      <Input
                        placeholder="401050"
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            accountNumber: e.target.value,
                          }))
                        }
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {showForm && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={13} className="animate-spin mr-1.5" />}
              Salvar credenciais
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
