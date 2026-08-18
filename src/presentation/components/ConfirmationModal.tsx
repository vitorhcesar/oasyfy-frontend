import ModalPortal from "@/presentation/components/ModalPortal";
import { Button } from "@/presentation/components/ui/button";
import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";

interface IConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "destructive" | "default";
  confirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
  confirmDisabled = false,
  onConfirm,
}: IConfirmationModalProps) {
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (confirmDisabled) return;

    setConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Keep the modal open so the user can retry after an error toast.
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
          <p
            className={`text-sm leading-relaxed text-muted-foreground ${
              children ? "mb-4" : "mb-5"
            }`}
          >
            {description}
          </p>
          {children ? <div className="mb-5">{children}</div> : null}
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
              disabled={confirming || confirmDisabled}
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
