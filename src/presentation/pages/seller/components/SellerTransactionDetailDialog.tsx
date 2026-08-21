import { PixIcon } from "@/presentation/components/PixIcon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/presentation/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { cn } from "@/presentation/utils/cn";
import {
  displayedTransactionStatus,
  isApprovedTransactionStatus,
  isExpiredUnpaidTransaction,
} from "@/presentation/utils/transaction-status";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export interface ISellerTransactionDetail {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  customer_name: string;
  customer_email: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  fee_amount: number;
  net_amount: number;
  pix_code: string | null;
  acquirer: string | null;
  metadata: Record<string, unknown> | null;
  refund_reason: string | null;
  lock_reason: string | null;
  is_locked: boolean;
  is_fake_refund: boolean;
}

interface ISellerTransactionDetailDialogProps {
  transaction: ISellerTransactionDetail | null;
  onClose: () => void;
}

const methodLabels: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  crypto: "Crypto",
  withdrawal: "Saque",
};

const statusUi: Record<
  string,
  { label: string; badge: string; icon: "check" | "clock" | "x" | "refund" }
> = {
  pending: {
    label: "Pendente",
    badge: "bg-warning/15 text-warning",
    icon: "clock",
  },
  completed: {
    label: "Pago",
    badge: "bg-success/15 text-success",
    icon: "check",
  },
  paid: {
    label: "Pago",
    badge: "bg-success/15 text-success",
    icon: "check",
  },
  failed: {
    label: "Recusado",
    badge: "bg-destructive/15 text-destructive",
    icon: "x",
  },
  expired: {
    label: "Pendente",
    badge: "bg-warning/15 text-warning",
    icon: "clock",
  },
  refunded: {
    label: "Estornada",
    badge: "bg-warning/15 text-warning",
    icon: "refund",
  },
  cancelled: {
    label: "Cancelada",
    badge: "bg-muted text-muted-foreground",
    icon: "x",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== "-" ? trimmed : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }
  return null;
}

function extractTaxId(value: unknown): string | null {
  if (typeof value === "string") {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 11 ? digits : null;
  }
  if (isRecord(value)) {
    return extractTaxId(value.taxID ?? value.taxId ?? value.tax_id);
  }
  return null;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatModalDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "d MMM, yyyy - HH:mm", { locale: ptBR }).replace(
    /(\d+\s)([a-zà-ú])/i,
    (_, prefix: string, letter: string) => prefix + letter.toUpperCase(),
  );
}

function maskDocument(digits: string): string {
  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  if (digits.length === 14) {
    return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-**`;
  }
  if (digits.length > 4) {
    return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  }
  return digits;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return value;
}

function toWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

function isSplitCredit(meta: Record<string, unknown> | null): boolean {
  return meta?.type === "split_credit";
}

function getSplitInfo(meta: Record<string, unknown> | null): {
  sellerAmount: number | null;
  partnerAmount: number;
  hasSplit: boolean;
} {
  if (!meta || isSplitCredit(meta) || !isRecord(meta.split)) {
    return { sellerAmount: null, partnerAmount: 0, hasSplit: false };
  }
  const split = meta.split;
  const breakdown = Array.isArray(split.breakdown) ? split.breakdown : [];
  const partnerAmount = breakdown.reduce((sum, item) => {
    if (!isRecord(item) || typeof item.amount !== "number") return sum;
    return sum + item.amount;
  }, 0);
  return {
    sellerAmount:
      typeof split.seller_amount === "number" ? split.seller_amount : null,
    partnerAmount,
    hasSplit: true,
  };
}

function readCustomerFromRecord(record: Record<string, unknown> | null) {
  if (!record) {
    return { name: null, email: null, phone: null, taxId: null };
  }
  const customer = isRecord(record.customer) ? record.customer : null;
  const payer = isRecord(record.payer) ? record.payer : null;
  const debitParty = isRecord(record.debitParty)
    ? record.debitParty
    : isRecord(record.debit_party)
      ? record.debit_party
      : null;

  return {
    name: pickString(customer?.name, payer?.name, debitParty?.name),
    email: pickString(customer?.email, payer?.email, record.email),
    phone: pickString(
      customer?.phone,
      payer?.phone,
      record.phone,
      record.customer_phone,
      record.customerPhone,
    ),
    taxId: extractTaxId(
      customer?.taxID ??
        customer?.taxId ??
        payer?.taxID ??
        payer?.taxId ??
        debitParty?.taxId ??
        debitParty?.taxID ??
        record.customerDocument ??
        record.customer_document,
    ),
  };
}

function findRecordWithKeys(
  root: Record<string, unknown>,
  keys: string[],
  depth = 0,
): Record<string, unknown> | null {
  if (depth > 5) return null;
  if (keys.some((key) => key in root)) return root;
  for (const value of Object.values(root)) {
    if (!isRecord(value)) continue;
    const found = findRecordWithKeys(value, keys, depth + 1);
    if (found) return found;
  }
  return null;
}

function extractDetailFields(tx: ISellerTransactionDetail) {
  const meta = tx.metadata ?? {};
  const woovi = isRecord(meta.woovi) ? meta.woovi : null;
  const webhook = isRecord(meta.woovi_last_webhook)
    ? meta.woovi_last_webhook
    : isRecord(meta.cartwave_last_webhook)
      ? meta.cartwave_last_webhook
      : null;
  const pix = isRecord(webhook?.pix)
    ? webhook.pix
    : isRecord(webhook?.transaction)
      ? webhook.transaction
      : isRecord(meta.pix)
        ? meta.pix
        : asString(meta.status) === "CONFIRMED" ||
            asString(meta.subType) === "CHARGE_PAYMENT"
          ? meta
          : findRecordWithKeys(meta, ["debitParty"]);
  const pixCharge = isRecord(pix?.charge) ? pix.charge : null;
  const charge = isRecord(webhook?.charge)
    ? webhook.charge
    : pixCharge
      ? pixCharge
      : isRecord(meta.charge)
        ? meta.charge
        : null;
  const payment = isRecord(webhook?.payment) ? webhook.payment : null;
  const debitParty = isRecord(pix?.debitParty)
    ? pix.debitParty
    : isRecord(pix?.debit_party)
      ? pix.debit_party
      : isRecord(charge?.debitParty)
        ? charge.debitParty
        : null;
  const creditParty = isRecord(pix?.creditParty)
    ? pix.creditParty
    : isRecord(pix?.credit_party)
      ? pix.credit_party
      : null;

  const fromCharge = readCustomerFromRecord(charge);
  const fromPixCharge = readCustomerFromRecord(pixCharge);
  const fromPix = readCustomerFromRecord(pix);
  const fromMeta = readCustomerFromRecord(meta);

  const split = getSplitInfo(meta);
  const splitCredit = isSplitCredit(meta);
  const approved = isApprovedTransactionStatus(tx.status);
  const rejected = tx.status === "failed" || tx.status === "cancelled";

  const paidAt = pickString(
    charge?.paidAt,
    charge?.paid_at,
    pix?.time,
    pixCharge?.paidAt,
    approved ? tx.updated_at : null,
  );

  const netFromTx =
    typeof tx.net_amount === "number" && tx.net_amount !== 0
      ? tx.net_amount
      : Math.abs(tx.amount) - tx.fee_amount;

  return {
    customerName:
      pickString(
        fromCharge.name,
        fromPixCharge.name,
        fromPix.name,
        fromMeta.name,
      ) ?? tx.customer_name,
    customerEmail:
      pickString(
        fromCharge.email,
        fromPixCharge.email,
        fromPix.email,
        fromMeta.email,
      ) ?? tx.customer_email,
    customerPhone: pickString(
      fromCharge.phone,
      fromPixCharge.phone,
      fromPix.phone,
      fromMeta.phone,
    ),
    customerDocument: pickString(
      fromCharge.taxId,
      fromPixCharge.taxId,
      fromPix.taxId,
      fromMeta.taxId,
    ),
    referenceId: pickString(
      woovi?.correlation_id,
      charge?.correlationID,
      charge?.correlationId,
      pixCharge?.correlationID,
      pix?.correlationID,
      meta.correlation_id,
    ),
    externalId: pickString(
      woovi?.transaction_id,
      woovi?.charge_id,
      charge?.transactionID,
      pixCharge?.transactionID,
      pix?.transactionID,
      charge?.identifier,
      pix?.identifier,
    ),
    globalId: pickString(
      woovi?.global_id,
      charge?.globalID,
      pixCharge?.globalID,
      pix?.globalID,
    ),
    endToEndId: pickString(
      woovi?.end_to_end_id,
      pix?.endToEndId,
      pix?.endToEndID,
      charge?.endToEndId,
      payment?.endToEndId,
      isRecord(webhook?.transaction) ? webhook.transaction.endToEndId : null,
    ),
    payerBank: pickString(debitParty?.bank, debitParty?.psp),
    payerName: pickString(debitParty?.name),
    receiverName: pickString(creditParty?.name, creditParty?.psp),
    paidAt: approved ? paidAt : null,
    rejectedAt: rejected ? tx.updated_at : null,
    split,
    splitCredit,
    youReceive: split.sellerAmount ?? netFromTx,
    parentId:
      typeof meta.parent_transaction_id === "number"
        ? String(meta.parent_transaction_id)
        : asString(meta.parent_transaction_id),
  };
}

function StatusIcon({
  kind,
  size = 22,
}: {
  kind: "check" | "clock" | "x" | "refund";
  size?: number;
}) {
  if (kind === "clock") return <Clock size={size} />;
  if (kind === "x") return <XCircle size={size} />;
  if (kind === "refund") return <RotateCcw size={size} />;
  return <CheckCircle2 size={size} />;
}

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("Copiado!");
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="group flex w-full min-w-0 items-start gap-2 text-left"
      title="Copiar"
    >
      <span className="min-w-0 flex-1 break-all font-mono text-xs font-medium leading-snug text-foreground">
        {value}
      </span>
      <Copy
        size={12}
        className={cn(
          "mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground",
          copied && "text-success",
        )}
      />
    </button>
  );
}

function TechnicalRow({
  label,
  value,
  copy,
}: {
  label: string;
  value: string | null;
  copy?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      {value ? (
        copy ? (
          <CopyableValue value={value} />
        ) : (
          <p className="break-words text-xs font-medium leading-snug text-foreground">
            {value}
          </p>
        )
      ) : (
        <p className="text-xs text-muted-foreground">—</p>
      )}
    </div>
  );
}

function TimelineRow({
  label,
  value,
  active,
  last,
}: {
  label: string;
  value: string;
  active: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-3 flex-col items-center">
        <span
          className={cn(
            "mt-1 h-2.5 w-2.5 rounded-full border-2",
            active
              ? "border-success bg-success"
              : "border-muted-foreground/40 bg-transparent",
          )}
        />
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 pb-4",
          last && "pb-0",
        )}
      >
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-right text-xs font-medium tabular-nums text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

export default function SellerTransactionDetailDialog({
  transaction,
  onClose,
}: ISellerTransactionDetailDialogProps) {
  const detail = useMemo(
    () => (transaction ? extractDetailFields(transaction) : null),
    [transaction],
  );

  const tx = transaction;
  const isWithdrawal = tx?.method === "withdrawal";
  const expired = tx ? isExpiredUnpaidTransaction(tx) : false;
  const status = tx
    ? (statusUi[displayedTransactionStatus(tx)] ?? {
        label: tx.status,
        badge: "bg-muted text-muted-foreground",
        icon: "clock" as const,
      })
    : null;
  const amountLabel = isWithdrawal ? "Valor da saída" : "Valor da entrada";
  const methodLabel = tx ? methodLabels[tx.method] || tx.method : "";
  const initial = (detail?.customerName || "?").trim().charAt(0).toUpperCase();
  const iconWrap =
    status?.icon === "check"
      ? "bg-success/15 text-success"
      : status?.icon === "x"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/15 text-warning";

  return (
    <Dialog
      open={!!tx}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {tx && detail && status ? (
        <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] min-w-0 max-w-[420px] flex-col gap-0 overflow-x-hidden overflow-y-auto border-border/60 p-0 sm:rounded-2xl">
        <DialogHeader className="px-5 pb-3 pt-5 pr-12 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Detalhes da transação
          </DialogTitle>
        </DialogHeader>

        <div className="min-w-0 space-y-3 overflow-x-hidden px-5 pb-5">
          {tx.refund_reason && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
                Motivo do estorno
              </p>
              <p className="mt-1 text-xs text-foreground">{tx.refund_reason}</p>
            </div>
          )}
          {tx.lock_reason && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
                Motivo do bloqueio
              </p>
              <p className="mt-1 text-xs text-foreground">{tx.lock_reason}</p>
            </div>
          )}

          <section className="rounded-xl border border-border/60 bg-card p-3.5">
            <p className="mb-3 text-[11px] font-medium text-muted-foreground">
              {amountLabel}
            </p>
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  iconWrap,
                )}
              >
                <StatusIcon kind={status.icon} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {isWithdrawal ? "- " : ""}
                  {formatCurrency(Math.abs(tx.amount))}
                </p>
              </div>
              <div className="flex min-w-0 max-w-[42%] shrink flex-col items-end gap-1">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    status.badge,
                  )}
                >
                  {status.label}
                </span>
                <span className="text-right text-[11px] leading-snug tabular-nums text-muted-foreground">
                  {formatModalDate(tx.created_at)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-3.5">
            <p className="mb-2.5 text-[11px] font-medium text-muted-foreground">
              Pagamento
            </p>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">
                {tx.method === "pix" ? (
                  <PixIcon className="h-5 w-5" />
                ) : (
                  <span className="text-[10px] font-semibold">
                    {methodLabel.slice(0, 2)}
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {methodLabel}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-3.5">
            <p className="mb-3 text-[11px] font-medium text-muted-foreground">
              Informações do cliente
            </p>
            <div className="mb-3 flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold capitalize text-foreground">
                  {detail.customerName}
                </p>
                {detail.customerEmail && (
                  <p className="break-all text-xs text-muted-foreground">
                    {detail.customerEmail}
                  </p>
                )}
                {detail.customerPhone && (
                  <a
                    href={toWhatsAppLink(detail.customerPhone)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-success/40 px-2.5 py-1.5 text-[11px] font-semibold text-success transition-colors hover:bg-success/10"
                  >
                    <MessageCircle size={13} />
                    Entrar em contato
                  </a>
                )}
              </div>
            </div>
            <div className="min-w-0 space-y-2.5 border-t border-border/50 pt-3">
              {detail.customerEmail && (
                <div className="flex min-w-0 items-start gap-2.5 text-xs">
                  <Mail size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="w-20 shrink-0 text-muted-foreground">E-mail</span>
                  <span className="min-w-0 flex-1 break-all font-medium text-foreground">
                    {detail.customerEmail}
                  </span>
                </div>
              )}
              {detail.customerDocument && (
                <div className="flex min-w-0 items-start gap-2.5 text-xs">
                  <FileText
                    size={14}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <span className="w-20 shrink-0 text-muted-foreground">Documento</span>
                  <span className="min-w-0 flex-1 break-all font-medium tabular-nums text-foreground">
                    {maskDocument(detail.customerDocument)}
                  </span>
                </div>
              )}
              {detail.customerPhone && (
                <div className="flex min-w-0 items-start gap-2.5 text-xs">
                  <Phone size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="w-20 shrink-0 text-muted-foreground">Telefone</span>
                  <span className="min-w-0 flex-1 break-all font-medium tabular-nums text-foreground">
                    {formatPhone(detail.customerPhone)}
                  </span>
                </div>
              )}
              {!detail.customerEmail &&
                !detail.customerDocument &&
                !detail.customerPhone && (
                  <p className="text-xs text-muted-foreground">
                    Sem dados adicionais do pagador.
                  </p>
                )}
            </div>
          </section>

          <Accordion
            type="multiple"
            defaultValue={["financial"]}
            className="min-w-0 space-y-2"
          >
            <AccordionItem
              value="financial"
              className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card px-3.5"
            >
              <AccordionTrigger className="py-3 text-left text-sm font-semibold hover:no-underline">
                Resumo Financeiro
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{amountLabel}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Taxas</span>
                    <span className="font-medium tabular-nums text-foreground">
                      - {formatCurrency(tx.fee_amount)}
                    </span>
                  </div>
                  {(detail.split.hasSplit || detail.splitCredit) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Split</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {detail.splitCredit
                          ? formatCurrency(Math.abs(tx.amount))
                          : `- ${formatCurrency(detail.split.partnerAmount)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 px-2 py-2">
                    <span className="text-xs font-semibold text-foreground">
                      Você recebe
                    </span>
                    <span className="text-sm font-bold tabular-nums text-primary">
                      {formatCurrency(Math.abs(detail.youReceive))}
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="dates"
              className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card px-3.5"
            >
              <AccordionTrigger className="py-3 text-left text-sm font-semibold hover:no-underline">
                Datas da transação
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <TimelineRow
                  label="Data/Hora gerado"
                  value={formatModalDate(tx.created_at)}
                  active
                />
                <TimelineRow
                  label="Data/Hora pago"
                  value={formatModalDate(detail.paidAt)}
                  active={Boolean(detail.paidAt)}
                />
                <TimelineRow
                  label={expired ? "Data/Hora expirado" : "Data/Hora recusado"}
                  value={formatModalDate(detail.rejectedAt)}
                  active={Boolean(detail.rejectedAt)}
                  last
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="technical"
              className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card px-3.5"
            >
              <AccordionTrigger className="py-3 text-left text-sm font-semibold hover:no-underline">
                Informações técnicas
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <div className="min-w-0 space-y-3">
                  <TechnicalRow label="ID interno" value={tx.id} copy />
                  <TechnicalRow
                    label="Reference ID"
                    value={detail.referenceId}
                    copy
                  />
                  <TechnicalRow
                    label="External ID"
                    value={detail.externalId}
                    copy
                  />
                  <TechnicalRow
                    label="End to end"
                    value={detail.endToEndId}
                    copy
                  />
                  {detail.globalId && (
                    <TechnicalRow
                      label="Global ID"
                      value={detail.globalId}
                      copy
                    />
                  )}
                  {detail.parentId && (
                    <TechnicalRow
                      label="Venda origem"
                      value={detail.parentId}
                      copy
                    />
                  )}
                  {tx.acquirer && (
                    <TechnicalRow label="Adquirente" value={tx.acquirer} />
                  )}
                  {detail.payerBank && (
                    <TechnicalRow
                      label="Banco de origem"
                      value={detail.payerBank}
                    />
                  )}
                  {detail.payerName &&
                    detail.payerName.toLowerCase() !==
                      detail.customerName.toLowerCase() && (
                      <TechnicalRow label="Pagador" value={detail.payerName} />
                    )}
                  {detail.receiverName && (
                    <TechnicalRow
                      label="Instituição recebedora"
                      value={detail.receiverName}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
