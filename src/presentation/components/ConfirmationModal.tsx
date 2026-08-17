import ModalPortal from "@/presentation/components/ModalPortal";
import { Button } from "@/presentation/components/ui/button";
import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";

interface IConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
  onConfirm,
}: IConfirmationModalProps) {
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={() => {
          if (!confirming) onOpenChange(false);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          className="admin-surface w-full max-w-md bg-card p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <h3
            id="confirmation-modal-title"
            className="mb-1.5 text-base font-semibold text-foreground"
          >
            {title}
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={confirming}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              disabled={confirming}
              onClick={() => void handleConfirm()}
            >
              {confirming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
