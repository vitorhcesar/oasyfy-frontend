import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { CheckCircle, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

function isProbablyPdf(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes(".pdf") || lower.includes("application/pdf");
}

interface IKycDocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string | null;
  /** Quando true, exibe ações de aprovar/recusar (admin). */
  reviewMode?: boolean;
  documentStatus?: "pending" | "approved" | "rejected" | string;
  onApprove?: () => void | Promise<void>;
  onReject?: (reason: string) => void | Promise<void>;
}

export default function KycDocumentPreviewModal({
  open,
  onOpenChange,
  title,
  url,
  reviewMode = false,
  documentStatus = "pending",
  onApprove,
  onReject,
}: IKycDocumentPreviewModalProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const isPdf = useMemo(() => (url ? isProbablyPdf(url) : false), [url]);

  const resetReject = () => {
    setRejectMode(false);
    setRejectReason("");
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      resetReject();
    }
    onOpenChange(next);
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setActionLoading(true);
    try {
      await onApprove();
      handleClose(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!onReject || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await onReject(rejectReason.trim());
      handleClose(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border/50 px-5 py-4 text-left">
          <DialogTitle className="text-base font-semibold text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto bg-muted/20 p-4">
          {!url ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Documento não disponível.
            </p>
          ) : isPdf ? (
            <div className="space-y-3">
              <iframe
                title={title}
                src={url}
                className="h-[60vh] w-full rounded-xl border border-border/40 bg-background"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <ExternalLink size={12} />
                Abrir PDF em nova aba
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt={title}
              className="mx-auto max-h-[60vh] w-auto max-w-full rounded-xl object-contain"
            />
          )}
        </div>

        {reviewMode && (
          <div className="space-y-3 border-t border-border/50 px-5 py-4">
            {!rejectMode ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {(documentStatus === "pending" ||
                  documentStatus === "approved") && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setRejectMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    Recusar
                  </button>
                )}
                {(documentStatus === "pending" ||
                  documentStatus === "rejected") && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleApprove()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-success/25 bg-success/10 px-3.5 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/15 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle size={15} />
                    )}
                    Aceitar
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motivo da recusa..."
                  className="flex-1 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive/40 focus:outline-none focus:ring-2 focus:ring-destructive/20"
                  maxLength={500}
                  autoFocus
                />
                <button
                  type="button"
                  disabled={!rejectReason.trim() || actionLoading}
                  onClick={() => void handleRejectConfirm()}
                  className="text-sm font-semibold text-destructive transition-colors hover:text-destructive/80 disabled:opacity-40"
                >
                  {actionLoading ? "Recusando..." : "Confirmar"}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={resetReject}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
