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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Copy,
  Eye,
  Lock,
  RotateCcw,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/format-currency";
import { methodLabel } from "../utils/method-label";
import { statusBadge } from "../utils/status-config";
import type {
  SellerInfo,
  SellerKyc,
  Transaction,
} from "../types/admin-transaction.type";

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
  return (
    <Dialog
      open={!!selectedTx}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Transação
            {selectedTx?.is_locked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                <Lock size={10} />
                Travada
              </span>
            )}
            {selectedTx?.is_fake_refund && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
                <Eye size={10} />
                Fake Refund
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedTx && (
          <Tabs defaultValue="venda" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="venda" className="flex-1 text-xs">
                Venda
              </TabsTrigger>
              <TabsTrigger value="mais" className="flex-1 text-xs">
                Mais Detalhes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="venda" className="space-y-5 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    ID da Transação
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs font-mono text-foreground break-all">
                      {selectedTx.id}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTx.id);
                        toast.success("ID copiado!");
                      }}
                      className="flex-shrink-0 p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copiar ID"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                {statusBadge(selectedTx.status)}
              </div>

              <div className="h-px bg-border/40" />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                    Seller / Produtor
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {sellerInfo?.full_name || "—"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    {sellerInfo?.account_id}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {sellerInfo?.email || sellerKyc?.email || "—"}
                  </p>
                  {sellerKyc?.cpf && (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      CPF: {sellerKyc.cpf}
                    </p>
                  )}
                  {sellerKyc?.cnpj && (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      CNPJ: {sellerKyc.cnpj}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border/40 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                    Cliente
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTx.customer_name}
                  </p>
                  {selectedTx.customer_email && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                      {selectedTx.customer_email}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/40 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                  Pagamento
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Método</p>
                    <p className="text-sm font-medium text-foreground">
                      {methodLabel[selectedTx.method] || selectedTx.method}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Adquirente</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedTx.acquirer || "Gateway interno"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data / Hora</p>
                    <p className="text-sm font-medium text-foreground">
                      {format(
                        new Date(selectedTx.created_at),
                        "dd/MM/yyyy 'às' HH:mm:ss",
                        { locale: ptBR },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Última atualização
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {format(
                        new Date(selectedTx.updated_at),
                        "dd/MM/yyyy 'às' HH:mm:ss",
                        { locale: ptBR },
                      )}
                    </p>
                  </div>
                  {selectedTx.pix_code && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        PIX Copia e Cola
                      </p>
                      <p className="text-xs font-mono text-foreground break-all mt-0.5">
                        {selectedTx.pix_code}
                      </p>
                    </div>
                  )}
                  {selectedTx.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Descrição</p>
                      <p className="text-sm text-foreground">
                        {selectedTx.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border/40 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                  Valores e Taxas
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Valor bruto
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(selectedTx.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Taxa cobrada
                    </span>
                    <span className="text-sm font-medium text-destructive">
                      -{formatCurrency(selectedTx.fee_amount)}
                    </span>
                  </div>
                  <div className="h-px bg-border/30" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">
                      Valor líquido
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(
                        selectedTx.net_amount ||
                          selectedTx.amount - selectedTx.fee_amount,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mais" className="space-y-5 mt-4">
              {selectedTx.lock_reason && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive uppercase tracking-wider font-medium mb-1">
                    Motivo do bloqueio
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedTx.lock_reason}
                  </p>
                </div>
              )}
              {selectedTx.refund_reason && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                  <p className="text-xs text-orange-600 uppercase tracking-wider font-medium mb-1">
                    Motivo do reembolso {selectedTx.is_fake_refund && "(FAKE)"}
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedTx.refund_reason}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-border/40 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                  Metadados
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Moeda</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedTx.currency?.toUpperCase() || "BRL"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedTx.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Travada</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedTx.is_locked ? "Sim" : "Não"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fake Refund</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedTx.is_fake_refund ? "Sim" : "Não"}
                    </p>
                  </div>
                </div>
                {selectedTx.metadata && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">Payload</p>
                    <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto text-foreground">
                      {JSON.stringify(selectedTx.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="h-px bg-border/40" />

              {selectedTx.status !== "refunded" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Ações
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={onShowRefundForm}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-medium hover:bg-orange-500/20 transition-colors border border-orange-500/20"
                    >
                      <RotateCcw size={12} /> Reembolsar
                    </button>
                    <button
                      onClick={onShowFakeRefundForm}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 text-xs font-medium hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                    >
                      <AlertTriangle size={12} /> Reembolso Fake
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTx.is_locked) {
                          onLockToggle();
                        } else {
                          onShowLockForm();
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                        selectedTx.is_locked
                          ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                          : "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
                      )}
                    >
                      {selectedTx.is_locked ? (
                        <>
                          <Unlock size={12} /> Destravar
                        </>
                      ) : (
                        <>
                          <Lock size={12} /> Travar Venda
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {showRefundForm && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-3 animate-fade-in">
                  <p className="text-sm font-semibold text-orange-600">
                    Reembolsar Venda
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    O saldo será devolvido ao cliente e descontado do seller.
                  </p>
                  <textarea
                    value={refundReason}
                    onChange={(e) => onRefundReasonChange(e.target.value)}
                    placeholder="Motivo do reembolso..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRefund(false)}
                      disabled={actionLoading || !refundReason.trim()}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processando..."
                        : "Confirmar Reembolso"}
                    </button>
                    <button
                      onClick={onHideRefundForm}
                      className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showFakeRefundForm && (
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-3 animate-fade-in">
                  <p className="text-sm font-semibold text-purple-600">
                    Reembolso Fake
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    A venda será marcada como reembolsada para o seller, mas o
                    saldo <b>NÃO</b> será devolvido.
                  </p>
                  <textarea
                    value={refundReason}
                    onChange={(e) => onRefundReasonChange(e.target.value)}
                    placeholder="Motivo do reembolso fake..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRefund(true)}
                      disabled={actionLoading || !refundReason.trim()}
                      className="px-4 py-2 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processando..."
                        : "Confirmar Fake Refund"}
                    </button>
                    <button
                      onClick={onHideFakeRefundForm}
                      className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {showLockForm && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3 animate-fade-in">
                  <p className="text-sm font-semibold text-destructive">
                    Travar Venda
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    A venda será bloqueada e o seller não poderá sacar este valor
                    até ser destravada.
                  </p>
                  <textarea
                    value={lockReason}
                    onChange={(e) => onLockReasonChange(e.target.value)}
                    placeholder="Motivo do bloqueio..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onLockToggle}
                      disabled={actionLoading || !lockReason.trim()}
                      className="px-4 py-2 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Processando..." : "Confirmar Bloqueio"}
                    </button>
                    <button
                      onClick={onHideLockForm}
                      className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
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
