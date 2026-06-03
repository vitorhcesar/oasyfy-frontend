import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IDeleteBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteId: number | null;
  onInvalidateQuery: () => Promise<void>;
}

export default function DeleteBannerModal({
  open,
  onOpenChange,
  deleteId,
  onInvalidateQuery,
}: IDeleteBannerModalProps) {
  const apiService = useApiService();

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminBanners.delete(deleteId);
        await onInvalidateQuery();
        toast.success("Banner removido");

        setTimeout(() => {
          onOpenChange(false);
        }, 200);
      },
      {
        defaultErrorMessage: "Erro ao remover banner",
        finallyFn: () => {
          setDeleting(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Remover banner
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mt-2">
          Tem certeza que deseja remover este banner? Esta ação não pode ser
          desfeita.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="py-2 rounded-lg border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className={cn(
              "py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-all",
              deleting ? "opacity-50 cursor-not-allowed" : "",
            )}
          >
            {deleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              "Remover"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
