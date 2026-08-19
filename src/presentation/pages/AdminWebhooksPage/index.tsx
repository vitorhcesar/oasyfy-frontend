import { Calendar } from "@/presentation/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import ListPagination from "@/presentation/components/ListPagination";
import type {
  IAdminWebhookDeliveryDetailDto,
  IAdminWebhookDeliveryListItemDto,
} from "@/infra/http/services/api/modules/admin-webhooks.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useAdminWebhookDeliveriesQuery from "@/presentation/hooks/use-admin-webhook-deliveries-query";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Eye,
  Loader2,
  RotateCw,
  Webhook,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AdminWebhookDetailDialog from "./components/AdminWebhookDetailDialog";

const PER_PAGE = 20;
type TTimeRange = "7d" | "30d" | "90d" | "custom";

const inputClass =
  "w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const selectClass =
  "w-full appearance-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer";

function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function resolveListRange(
  filterTimeRange: TTimeRange,
  dateRange: DateRange | undefined,
): { from?: string; to?: string } {
  if (filterTimeRange === "custom" && dateRange?.from) {
    return {
      from: dateRange.from.toISOString(),
      to: dateRange.to ? endOfDay(dateRange.to).toISOString() : undefined,
    };
  }
  const days =
    filterTimeRange === "30d" ? 30 : filterTimeRange === "90d" ? 90 : 7;
  return {
    from: new Date(Date.now() - days * 86400000).toISOString(),
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  success: {
    label: "Sucesso",
    cls: "border-success/25 bg-success/10 text-success",
  },
  pending: {
    label: "Pendente",
    cls: "border-warning/25 bg-warning/10 text-warning",
  },
  failed: {
    label: "Falhou",
    cls: "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

function statusBadge(status: string) {
  const config = STATUS_BADGE[status] ?? {
    label: status,
    cls: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold",
        config.cls,
      )}
    >
      {config.label}
    </span>
  );
}

export default function AdminWebhooksPage() {
  const apiService = useApiService();
  const [searchParams] = useSearchParams();
  const initialTransactionId = searchParams.get("transactionId") ?? "";
  const initialDeliveryId = searchParams.get("deliveryId") ?? "";
  const initialStatus = searchParams.get("status") ?? "";
  const initialSellerId = searchParams.get("sellerId") ?? "";

  const [filterTransactionId, setFilterTransactionId] =
    useState(initialTransactionId);
  const [filterSeller, setFilterSeller] = useState(initialSellerId);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [filterSource, setFilterSource] = useState("");
  const [filterScope, setFilterScope] = useState("");
  const [filterUrl, setFilterUrl] = useState("");
  const [filterTimeRange, setFilterTimeRange] = useState<TTimeRange>("7d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedTx, setDebouncedTx] = useState(initialTransactionId);
  const [debouncedSeller, setDebouncedSeller] = useState(initialSellerId);
  const [debouncedUrl, setDebouncedUrl] = useState("");
  const [detail, setDetail] = useState<IAdminWebhookDeliveryDetailDto | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedTx(filterTransactionId),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [filterTransactionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSeller(filterSeller), 300);
    return () => window.clearTimeout(timer);
  }, [filterSeller]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUrl(filterUrl), 300);
    return () => window.clearTimeout(timer);
  }, [filterUrl]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedTx,
    debouncedSeller,
    debouncedUrl,
    filterStatus,
    filterSource,
    filterScope,
    filterTimeRange,
    dateRange,
  ]);

  const listRange = useMemo(
    () => resolveListRange(filterTimeRange, dateRange),
    [filterTimeRange, dateRange],
  );

  const {
    data: rows,
    isLoading: loading,
    total,
    totalPages,
    stats,
    invalidateQuery,
  } = useAdminWebhookDeliveriesQuery({
    page: currentPage,
    limit: PER_PAGE,
    status: filterStatus || undefined,
    source: filterSource || undefined,
    scope: filterScope || undefined,
    seller: debouncedSeller || undefined,
    transactionId: debouncedTx || undefined,
    deliveryId: initialDeliveryId || undefined,
    url: debouncedUrl || undefined,
    from: listRange.from,
    to: listRange.to,
  });

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await apiService.modules.adminWebhooks.getDelivery(id);
      setDetail(data);
    } catch {
      toast.error("Não foi possível carregar o webhook");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResend = async (id: number) => {
    if (
      !window.confirm("Vai POSTAR de novo o mesmo evento para esta URL.")
    ) {
      return;
    }
    setResendingId(id);
    try {
      const created = await apiService.modules.adminWebhooks.resendDelivery(id);
      toast.success("Webhook reenviado");
      await invalidateQuery();
      const latest = await apiService.modules.adminWebhooks.getDelivery(
        created.id,
      );
      setDetail(latest);
    } catch {
      toast.error("Falha ao reenviar o webhook");
    } finally {
      setResendingId(null);
    }
  };

  const statCards = [
    {
      key: "success",
      label: "Sucesso",
      count: stats.success,
      active: "border-success/45 !bg-success/20",
    },
    {
      key: "pending",
      label: "Pendente",
      count: stats.pending,
      active: "border-warning/45 !bg-warning/20",
    },
    {
      key: "failed",
      label: "Falhou",
      count: stats.failed,
      active: "border-destructive/45 !bg-destructive/20",
    },
  ];

  return (
    <AdminLayout>
      <div className="px-4 py-6 md:px-8 md:py-8">
        <header className="mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Comercial
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
              Webhooks
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Envios para os endpoints dos produtores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="liquid-glass-control flex items-center gap-0.5 rounded-2xl p-1">
              {(["7d", "30d", "90d"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => {
                    setFilterTimeRange(period);
                    setDateRange(undefined);
                  }}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold uppercase tracking-wide transition-all",
                    filterTimeRange === period
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "liquid-glass-control flex h-10 items-center gap-2 rounded-2xl px-3.5 text-sm font-medium transition-colors hover:bg-white/10",
                    filterTimeRange === "custom" &&
                      "border-primary/50 text-primary",
                  )}
                >
                  <CalendarIcon size={15} />
                  {filterTimeRange === "custom" && dateRange?.from
                    ? format(dateRange.from, "dd/MM", { locale: ptBR })
                    : "Período"}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="liquid-glass-control w-auto border-white/15 p-3"
                align="end"
              >
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from) setFilterTimeRange("custom");
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="pointer-events-auto"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-3 gap-3">
              {statCards.map((card) => {
                const isActive = filterStatus === card.key;
                return (
                  <button
                    key={card.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() =>
                      setFilterStatus(isActive ? "" : card.key)
                    }
                    className={cn(
                      "admin-surface admin-surface-interactive p-3.5 text-left",
                      isActive && card.active,
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                      {card.count}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="admin-surface mb-6 p-4 md:p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Filtros
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <input
                  value={filterTransactionId}
                  onChange={(event) =>
                    setFilterTransactionId(event.target.value)
                  }
                  placeholder="ID transação"
                  className={inputClass}
                />
                <input
                  value={filterSeller}
                  onChange={(event) => setFilterSeller(event.target.value)}
                  placeholder="Seller, e-mail ou conta"
                  className={inputClass}
                />
                <input
                  value={filterUrl}
                  onChange={(event) => setFilterUrl(event.target.value)}
                  placeholder="URL do endpoint"
                  className={inputClass}
                />
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Status</option>
                  <option value="success">Sucesso</option>
                  <option value="pending">Pendente</option>
                  <option value="failed">Falhou</option>
                </select>
                <select
                  value={filterSource}
                  onChange={(event) => setFilterSource(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Origem</option>
                  <option value="automatic">Automático</option>
                  <option value="replay">Reenvio</option>
                  <option value="test">Teste</option>
                </select>
                <select
                  value={filterScope}
                  onChange={(event) => setFilterScope(event.target.value)}
                  className={selectClass}
                >
                  <option value="">Escopo</option>
                  <option value="account">Conta</option>
                  <option value="gateway">Por venda</option>
                </select>
              </div>
            </div>

            {total === 0 ? (
              <div className="admin-surface px-6 py-16 text-center">
                <Webhook
                  className="mx-auto mb-3 text-muted-foreground"
                  size={24}
                />
                <p className="mb-1 text-base font-semibold text-foreground">
                  Nenhum webhook enviado neste período.
                </p>
                <p className="text-sm text-muted-foreground">
                  Os POSTs para os endpoints dos produtores aparecem aqui.
                </p>
              </div>
            ) : (
              <div className="admin-surface overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[960px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      {[
                        "Data",
                        "Seller",
                        "Evento",
                        "URL",
                        "Escopo",
                        "Transação",
                        "Status",
                        "HTTP",
                        "",
                      ].map((label) => (
                        <th
                          key={label || "actions"}
                          className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row: IAdminWebhookDeliveryListItemDto) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-foreground">
                          {format(
                            new Date(row.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR },
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground">
                          <p className="font-medium">{row.seller_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.seller_account_id ?? row.seller_email}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                          {row.event}
                          {row.source === "replay" ? " · replay" : ""}
                          {row.test ? " · teste" : ""}
                        </td>
                        <td
                          className="max-w-[220px] truncate px-5 py-3.5 text-xs text-muted-foreground"
                          title={row.endpoint_url}
                        >
                          {row.endpoint_url}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground">
                          {row.endpoint_scope === "gateway"
                            ? "Venda"
                            : "Conta"}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground">
                          {row.transaction_id ? (
                            <>
                              #{row.transaction_id}
                              {row.transaction_amount != null
                                ? ` · ${formatCurrency(row.transaction_amount)}`
                                : ""}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {statusBadge(row.status)}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {row.attempts}/5
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                          {row.last_status_code ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => void openDetail(row.id)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Detalhes"
                            >
                              <Eye size={15} />
                            </button>
                            {row.status === "failed" && (
                              <button
                                type="button"
                                disabled={resendingId === row.id}
                                onClick={() => void handleResend(row.id)}
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Reenviar"
                              >
                                {resendingId === row.id ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <RotateCw size={15} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ListPagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  perPage={PER_PAGE}
                  onPageChange={setCurrentPage}
                  variant="table"
                />
              </div>
            )}
          </>
        )}
      </div>

      <AdminWebhookDetailDialog
        detail={detail}
        loading={detailLoading && !detail}
        resending={resendingId === detail?.id}
        onClose={() => {
          setDetail(null);
        }}
        onResend={() => {
          if (detail) void handleResend(detail.id);
        }}
      />
    </AdminLayout>
  );
}
