import { Button } from "@/presentation/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Input } from "@/presentation/components/ui/input";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CONFIRMATION_TEXT = "EXCLUIR";

export interface IDeleteSellerAccountTarget {
  userId: number;
  fullName: string | null;
  email?: string | null;
}

interface IDeleteSellerAccountModalProps {
  seller: IDeleteSellerAccountTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (sellerId: number) => void;
}

export default function DeleteSellerAccountModal({
  seller,
  open,
  onOpenChange,
  onDeleted,
}: IDeleteSellerAccountModalProps) {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmation("");
      setDeleting(false);
    }
  }, [open]);

  const canDelete =
    confirmation.trim().toUpperCase() === CONFIRMATION_TEXT && !deleting;

  const handleDelete = async () => {
    if (!seller || !canDelete) return;

    setDeleting(true);
    try {
      await apiService.modules.adminSellers.deleteSeller(seller.userId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "kyc-submissions"] }),
      ]);
      toast.success("Seller excluído. A conta precisará ser cadastrada de novo.");
      onDeleted(seller.userId);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(error, "Erro ao excluir o seller"),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-destructive">
            Excluir seller
          </DialogTitle>
          <DialogDescription>
            Esta ação é permanente. A conta, o KYC, transações, arquivos e todos
            os dados atrelados serão removidos. O usuário precisará se cadastrar
            novamente.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Seller: </span>
            <span className="font-medium text-foreground">
              {seller?.fullName || "Sem nome"}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">ID: </span>
            <span className="font-mono text-foreground">#{seller?.userId}</span>
          </p>
          {seller?.email ? (
            <p>
              <span className="text-muted-foreground">E-mail: </span>
              <span className="text-foreground">{seller.email}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          <label htmlFor="delete-seller-confirm" className="text-xs text-muted-foreground">
            Digite <span className="font-semibold text-foreground">{CONFIRMATION_TEXT}</span>{" "}
            para confirmar
          </label>
          <Input
            id="delete-seller-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={CONFIRMATION_TEXT}
            autoComplete="off"
            disabled={deleting}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Excluir conta"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
