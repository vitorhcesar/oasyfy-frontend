import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import type {
  IAdminWebhookDeliveryAttemptDto,
  IAdminWebhookDeliveryDetailDto,
} from "@/infra/http/services/api/modules/admin-webhooks.module";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Loader2, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 md:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      {children}
    </div>
  );
}

function copy(value: string, label: string) {
  void navigator.clipboard.writeText(value);
  toast.success(`${label} copiado`);
}

function ScrollField({
  value,
  copyLabel,
  maxHeightClass = "",
}: {
  value: string;
  copyLabel: string;
  maxHeightClass?: string;
}) {
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => copy(value, copyLabel)}
        className="absolute right-1.5 top-1.5 z-10 rounded-lg bg-background/80 p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Copiar"
      >
        <Copy size={13} />
      </button>
      <div
        className={cn(
          "max-w-full min-w-0 overflow-x-auto rounded-xl bg-muted/40",
          maxHeightClass,
        )}
      >
        <pre className="w-max min-w-full whitespace-pre px-3 py-2 pr-10 font-mono text-xs leading-relaxed text-foreground">
          {value}
        </pre>
      </div>
    </div>
  );
}

function HeadersList({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem headers.</p>;
  }
  return (
    <div className="min-w-0 space-y-2">
      {entries.map(([name, value]) => (
        <div key={name} className="min-w-0">
          <p className="mb-1 font-mono text-[11px] text-muted-foreground">
            {name}
          </p>
          <ScrollField value={value} copyLabel={name} />
        </div>
      ))}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: IAdminWebhookDeliveryAttemptDto }) {
  const responseBody = attempt.response_body
    ? `${attempt.response_body}${attempt.response_body_truncated ? "\n… (truncado)" : ""}`
    : null;
  return (
    <div className="min-w-0 rounded-xl border border-border/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Tentativa {attempt.attempt_number}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(attempt.created_at), "dd/MM/yyyy HH:mm:ss", {
            locale: ptBR,
          })}
          {attempt.duration_ms >= 0 ? ` · ${attempt.duration_ms}ms` : ""}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        HTTP {attempt.response_status_code ?? "—"}
        {attempt.error ? ` · ${attempt.error}` : ""}
      </p>
      {responseBody ? (
        <div className="mt-2 min-w-0">
          <ScrollField
            value={responseBody}
            copyLabel="Resposta"
            maxHeightClass="max-h-40 overflow-y-auto"
          />
        </div>
      ) : null}
    </div>
  );
}

interface IAdminWebhookDetailDialogProps {
  detail: IAdminWebhookDeliveryDetailDto | null;
  loading: boolean;
  resending?: boolean;
  mode?: "admin" | "seller";
  onClose: () => void;
  onResend?: () => void;
}

export default function AdminWebhookDetailDialog({
  detail,
  loading,
  resending = false,
  mode = "admin",
  onClose,
  onResend,
}: IAdminWebhookDetailDialogProps) {
  const isAdmin = mode === "admin";
  return (
    <Dialog
      open={!!detail || loading}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] min-w-0 max-w-2xl flex-col overflow-x-hidden overflow-y-auto border-border/60 bg-background">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Detalhes do webhook
          </DialogTitle>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-2 min-w-0 space-y-4">
            <SectionCard title="Resumo">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Evento</p>
                  <div className="overflow-x-auto">
                    <p className="w-max font-mono text-sm whitespace-nowrap text-foreground">
                      {detail.event_id}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Delivery</p>
                  <div className="max-w-full overflow-x-auto">
                    <button
                      type="button"
                      className="font-mono text-sm whitespace-nowrap text-foreground hover:underline"
                      onClick={() => copy(detail.delivery_id, "Delivery ID")}
                    >
                      {detail.delivery_id}
                    </button>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="text-sm text-foreground">
                    {detail.source}
                    {detail.test ? " · teste" : ""}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Tentativas</p>
                  <p className="text-sm text-foreground">
                    {detail.attempts}/5
                    {detail.last_status_code
                      ? ` · HTTP ${detail.last_status_code}`
                      : ""}
                  </p>
                </div>
              </div>
              {detail.last_error && (
                <p className="mt-3 break-all text-sm text-destructive">
                  {detail.last_error}
                </p>
              )}
            </SectionCard>

            <SectionCard title="Request">
              <p className="mb-1 text-xs text-muted-foreground">POST</p>
              <ScrollField value={detail.request.url} copyLabel="URL" />
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Headers
              </p>
              <HeadersList headers={detail.request.headers} />
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payload
              </p>
              <ScrollField
                value={JSON.stringify(detail.payload, null, 2)}
                copyLabel="Payload"
                maxHeightClass="max-h-72 overflow-y-auto"
              />
            </SectionCard>

            <SectionCard title="Tentativas">
              {detail.attempts_log.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem log de tentativas (envio anterior à auditoria). Status
                  HTTP: {detail.last_status_code ?? "—"}.
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.attempts_log.map((attempt) => (
                    <AttemptRow
                      key={attempt.attempt_number}
                      attempt={attempt}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Transação">
              {detail.transaction ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    #{detail.transaction.id} · {detail.transaction.status} ·{" "}
                    {formatCurrency(detail.transaction.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {detail.transaction.customer_name}
                    {detail.transaction.customer_email
                      ? ` · ${detail.transaction.customer_email}`
                      : ""}
                  </p>
                  <Link
                    to={isAdmin ? "/admin/transactions" : "/seller/transactions"}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Abrir nas vendas
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Evento de teste (sem transação).
                </p>
              )}
            </SectionCard>

            <SectionCard title="Endpoint">
              <ScrollField value={detail.endpoint_url} copyLabel="URL" />
              <p className="mt-1 text-sm text-muted-foreground">
                {detail.endpoint_scope === "gateway" ? "Por venda" : "Conta"}
                {detail.endpoint_is_active ? "" : " · inativo"}
              </p>
              {isAdmin ? (
                <Link
                  to={`/admin/kyc?sellerId=${detail.seller_id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  {detail.seller_name}
                  {detail.seller_account_id
                    ? ` · ${detail.seller_account_id}`
                    : ""}
                </Link>
              ) : null}
            </SectionCard>

            {isAdmin && onResend ? (
              <button
                type="button"
                disabled={resending}
                onClick={onResend}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15",
                  resending && "opacity-70",
                )}
              >
                {resending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCw size={16} />
                )}
                Reenviar webhook
              </button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
