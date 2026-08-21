import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { cn } from "@/presentation/utils/cn";
import useAdminSellersByAccountIdsQuery from "@/presentation/hooks/use-admin-sellers-by-account-ids-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Copy,
  Eye,
  Lock,
  RotateCcw,
  Unlock,
  Webhook,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { toast } from "sonner";
import type {
  SellerInfo,
  SellerKyc,
  Transaction,
} from "../types/admin-transaction.type";
import { formatCurrency } from "../utils/format-currency";
import { methodLabel } from "../utils/method-label";
import { transactionStatusBadge } from "../utils/status-config";
import { isAdminBalanceAdjustment } from "../utils/is-admin-balance-adjustment";
import { getSaleSplitDetails } from "../utils/transaction-split";

interface IAdminTransactionDetailDialogProps {
  selectedTx: Transaction | null;
  sellerInfo: SellerInfo | null;
  sellerKyc: SellerKyc | null;
  actionLoading: boolean;
  refundReason: string;
  lockReason: string;
  showRefundForm: boolean;
  showFakeRefundForm: boolean;
  showLockForm: boolean;
  onClose: () => void;
  onRefundReasonChange: (value: string) => void;
  onLockReasonChange: (value: string) => void;
  onShowRefundForm: () => void;
  onShowFakeRefundForm: () => void;
  onShowLockForm: () => void;
  onHideRefundForm: () => void;
  onHideFakeRefundForm: () => void;
  onHideLockForm: () => void;
  onRefund: (fake: boolean) => void;
  onLockToggle: () => void;
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

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SplitPartyRow({
  title,
  email,
  accountId,
  percentage,
  amount,
}: {
  title: string;
  email: string | null | undefined;
  accountId: string | null | undefined;
  percentage: number | null;
  amount: number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {email && (
          <p className="break-all text-sm text-foreground/80">{email}</p>
        )}
        <p className="truncate text-xs text-muted-foreground">
          {[accountId, percentage != null ? `${percentage}%` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {amount != null ? formatCurrency(amount) : "—"}
      </span>
    </div>
  );
}

export default function AdminTransactionDetailDialog({
  selectedTx,
  sellerInfo,
  sellerKyc,
  actionLoading,
  refundReason,
  lockReason,
  showRefundForm,
  showFakeRefundForm,
  showLockForm,
  onClose,
  onRefundReasonChange,
  onLockReasonChange,
  onShowRefundForm,
  onShowFakeRefundForm,
  onShowLockForm,
  onHideRefundForm,
  onHideFakeRefundForm,
  onHideLockForm,
  onRefund,
  onLockToggle,
}: IAdminTransactionDetailDialogProps) {
  const splitDetails = useMemo(
    () => getSaleSplitDetails(selectedTx?.metadata),
    [selectedTx?.metadata],
  );
  const partnerAccountIds = useMemo(
    () => splitDetails?.breakdown.map((item) => item.accountId) ?? [],
    [splitDetails],
  );
  const { data: partnerSellers } =
    useAdminSellersByAccountIdsQuery(partnerAccountIds);
  const partnerByAccountId = useMemo(
    () => new Map(partnerSellers.map((seller) => [seller.accountId, seller])),
    [partnerSellers],
  );
  const sellerEmail = sellerInfo?.email || sellerKyc?.email;
  const splitSourceLabel =
    splitDetails?.source === "request"
      ? "Definido na API"
      : splitDetails?.source === "partners"
        ? "Sócios da conta"
        : null;

  return (
    <Dialog
      open={!!selectedTx}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl min-w-0 overflow-x-hidden overflow-y-auto border-border/60 bg-background">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight">
            Detalhes da Transação
            {selectedTx?.is_locked && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                <Lock size={12} />
                Travada
              </span>
            )}
            {selectedTx?.is_fake_refund && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                <Eye size={12} />
                Fake Refund
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedTx && (
          <Tabs defaultValue="venda" className="mt-2 min-w-0">
            <TabsList className="liquid-glass-control h-auto w-full gap-0.5 rounded-2xl p-1">
              <TabsTrigger
                value="venda"
                className="flex-1 rounded-xl px-3.5 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
              >
                Venda
              </TabsTrigger>
              <TabsTrigger
                value="mais"
                className="flex-1 rounded-xl px-3.5 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
              >
                Mais Detalhes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="venda" className="mt-5 min-w-0 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    ID da Transação
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <p className="break-all font-mono text-sm text-foreground">
                      {selectedTx.id}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTx.id);
                        toast.success("ID copiado!");
                      }}
                      className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Copiar ID"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                {transactionStatusBadge(selectedTx)}
              </div>

              <Link
                to={`/admin/webhooks?transactionId=${selectedTx.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Webhook size={14} />
                Webhooks desta venda
              </Link>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SectionCard title="Seller / Produtor">
                  <p className="text-base font-semibold text-foreground">
                    {sellerInfo?.full_name || "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sellerInfo?.account_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sellerInfo?.email || sellerKyc?.email || "—"}
                  </p>
                  {sellerKyc?.cpf && (
                    <p className="text-sm text-muted-foreground">
                      CPF: {sellerKyc.cpf}
                    </p>
                  )}
                  {sellerKyc?.cnpj && (
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {sellerKyc.cnpj}
                    </p>
                  )}
                </SectionCard>

                <SectionCard title="Cliente">
                  <p className="text-base font-semibold text-foreground">
                    {selectedTx.customer_name}
                  </p>
                  {selectedTx.customer_email && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedTx.customer_email}
                    </p>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Pagamento">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <MetaItem
                    label="Método"
                    value={
                      methodLabel[selectedTx.method] || selectedTx.method
                    }
                  />
                  <MetaItem
                    label="Adquirente"
                    value={selectedTx.acquirer || "Gateway interno"}
                  />
                  <MetaItem
                    label="Data / Hora"
                    value={format(
                      new Date(selectedTx.created_at),
                      "dd/MM/yyyy 'às' HH:mm:ss",
                      { locale: ptBR },
                    )}
                  />
                  <MetaItem
                    label="Última atualização"
                    value={format(
                      new Date(selectedTx.updated_at),
                      "dd/MM/yyyy 'às' HH:mm:ss",
                      { locale: ptBR },
                    )}
                  />
                  {selectedTx.pix_code && (
                    <div className="col-span-full">
                      <p className="text-sm text-muted-foreground">
                        PIX Copia e Cola
                      </p>
                      <p className="mt-0.5 break-all font-mono text-sm text-foreground">
                        {selectedTx.pix_code}
                      </p>
                    </div>
                  )}
                  {selectedTx.description && (
                    <div className="col-span-full">
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">
                        {selectedTx.description}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Valores e Taxas">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Valor bruto
                    </span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatCurrency(selectedTx.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Taxa cobrada
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-destructive">
                      -{formatCurrency(selectedTx.fee_amount)}
                    </span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Valor líquido
                    </span>
                    <span className="text-base font-bold tabular-nums text-success">
                      {formatCurrency(
                        selectedTx.net_amount ||
                          selectedTx.amount - selectedTx.fee_amount,
                      )}
                    </span>
                  </div>
                </div>
              </SectionCard>

              {splitDetails && (
                <SectionCard title="Split">
                  <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3">
                    <MetaItem
                      label="Status"
                      value={
                        splitDetails.settledAt
                          ? `Liquidado em ${format(
                              new Date(splitDetails.settledAt),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR },
                            )}`
                          : "Aguardando pagamento"
                      }
                    />
                    {splitSourceLabel && (
                      <MetaItem label="Origem" value={splitSourceLabel} />
                    )}
                    {splitDetails.baseAmount != null && (
                      <MetaItem
                        label={
                          splitDetails.base === "net"
                            ? "Base (líquido)"
                            : "Base"
                        }
                        value={formatCurrency(splitDetails.baseAmount)}
                      />
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <SplitPartyRow
                      title={sellerInfo?.full_name || "Seller / Produtor"}
                      email={sellerEmail}
                      accountId={sellerInfo?.account_id}
                      percentage={splitDetails.sellerPercentage}
                      amount={splitDetails.sellerAmount}
                    />

                    {splitDetails.breakdown.map((item) => {
                      const partner = partnerByAccountId.get(item.accountId);
                      return (
                        <SplitPartyRow
                          key={item.accountId}
                          title={
                            partner?.fullName ||
                            item.description ||
                            "Sócio"
                          }
                          email={partner?.email}
                          accountId={item.accountId}
                          percentage={item.percentage}
                          amount={item.amount}
                        />
                      );
                    })}
                  </div>

                  {splitDetails.skipped.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                        Não liquidados
                      </p>
                      {splitDetails.skipped.map((item) => (
                        <p
                          key={item.accountId}
                          className="text-sm text-muted-foreground"
                        >
                          {item.accountId}: {item.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}
            </TabsContent>

            <TabsContent value="mais" className="mt-5 min-w-0 space-y-4">
              {selectedTx.lock_reason && (
                <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
                    Motivo do bloqueio
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedTx.lock_reason}
                  </p>
                </div>
              )}
              {selectedTx.refund_reason && (
                <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-warning">
                    Motivo do reembolso {selectedTx.is_fake_refund && "(FAKE)"}
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedTx.refund_reason}
                  </p>
                </div>
              )}

              <SectionCard title="Metadados">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <MetaItem
                    label="Moeda"
                    value={selectedTx.currency?.toUpperCase() || "BRL"}
                  />
                  <MetaItem label="Status" value={selectedTx.status} />
                  <MetaItem
                    label="Travada"
                    value={selectedTx.is_locked ? "Sim" : "Não"}
                  />
                  <MetaItem
                    label="Fake Refund"
                    value={selectedTx.is_fake_refund ? "Sim" : "Não"}
                  />
                </div>
                {selectedTx.metadata && (
                  <div className="mt-4 min-w-0 overflow-hidden">
                    <p className="mb-1.5 text-sm text-muted-foreground">
                      Payload
                    </p>
                    <pre className="max-w-full min-w-0 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border/50 bg-muted/40 p-3 font-mono text-xs text-foreground">
                      {JSON.stringify(selectedTx.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </SectionCard>

              {selectedTx.status !== "refunded" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Ações
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!isAdminBalanceAdjustment(selectedTx) &&
                    selectedTx.method !== "minigame" && (
                      <>
                    <button
                      onClick={onShowRefundForm}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 text-sm font-semibold text-warning transition-colors hover:bg-warning hover:text-warning-foreground"
                    >
                      <RotateCcw size={14} /> Reembolsar
                    </button>
                    <button
                      onClick={onShowFakeRefundForm}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <AlertTriangle size={14} /> Reembolso Fake
                    </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (selectedTx.is_locked) {
                          onLockToggle();
                        } else {
                          onShowLockForm();
                        }
                      }}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
                        selectedTx.is_locked
                          ? "border-transparent bg-white text-[#111827] hover:bg-white/90"
                          : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
                      )}
                    >
                      {selectedTx.is_locked ? (
                        <>
                          <Unlock size={14} /> Destravar
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Travar Venda
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {showRefundForm && !isAdminBalanceAdjustment(selectedTx) && (
                <div className="animate-fade-in space-y-3 rounded-2xl border border-warning/25 bg-warning/10 p-4">
                  <p className="text-base font-semibold text-warning">
                    Reembolsar Venda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O saldo será devolvido ao cliente e descontado do seller.
                  </p>
                  <textarea
                    value={refundReason}
                    onChange={(e) => onRefundReasonChange(e.target.value)}
                    placeholder="Motivo do reembolso (opcional)"
                    className="h-20 w-full resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-warning/40 focus:outline-none focus:ring-2 focus:ring-warning/20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onRefund(false)}
                      disabled={actionLoading}
                      className="h-10 rounded-xl bg-warning px-4 text-sm font-semibold text-warning-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processando..."
                        : "Confirmar Reembolso"}
                    </button>
                    <button
                      onClick={onHideRefundForm}
                      className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showFakeRefundForm && !isAdminBalanceAdjustment(selectedTx) && (
                <div className="animate-fade-in space-y-3 rounded-2xl border border-primary/25 bg-primary/10 p-4">
                  <p className="text-base font-semibold text-primary">
                    Reembolso Fake
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A venda será marcada como reembolsada para o seller, mas o
                    saldo <b>NÃO</b> será devolvido.
                  </p>
                  <textarea
                    value={refundReason}
                    onChange={(e) => onRefundReasonChange(e.target.value)}
                    placeholder="Motivo do reembolso fake (opcional)"
                    className="h-20 w-full resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onRefund(true)}
                      disabled={actionLoading}
                      className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processando..."
                        : "Confirmar Fake Refund"}
                    </button>
                    <button
                      onClick={onHideFakeRefundForm}
                      className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showLockForm && (
                <div className="animate-fade-in space-y-3 rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
                  <p className="text-base font-semibold text-destructive">
                    Travar Venda
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A venda será bloqueada e o seller não poderá sacar este
                    valor até ser destravada.
                  </p>
                  <textarea
                    value={lockReason}
                    onChange={(e) => onLockReasonChange(e.target.value)}
                    placeholder="Motivo do bloqueio..."
                    className="h-20 w-full resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive/40 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={onLockToggle}
                      disabled={actionLoading || !lockReason.trim()}
                      className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading ? "Processando..." : "Confirmar Bloqueio"}
                    </button>
                    <button
                      onClick={onHideLockForm}
                      className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
