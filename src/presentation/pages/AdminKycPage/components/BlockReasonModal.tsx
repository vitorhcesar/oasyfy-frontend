import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { toast } from "sonner";
import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";

interface IBlockReasonModalProps {
  submissionId: string;
  onUpdate: () => void;
}

export default function BlockReasonModal({
  submissionId,
  onUpdate,
}: IBlockReasonModalProps) {
  const apiService = useApiService();

  const { setShowBlockReasonModal, blockReason, setBlockReason } =
    useAdminKycDetailsStore();

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => setShowBlockReasonModal(false)}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Travar saque
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Informe o motivo do bloqueio. O seller verá esta mensagem.
        </p>
        <textarea
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
          placeholder="Motivo do bloqueio de saque..."
          className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowBlockReasonModal(false)}
            className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={!blockReason.trim()}
            onClick={async () => {
              await tryOrToastError(
                async () => {
                  await apiService.modules.adminKycSubmissions.blockWithdrawals(
                    Number(submissionId),
                    { reason: blockReason.trim() },
                  );
                  toast.success("Saque travado");
                  setShowBlockReasonModal(false);
                  onUpdate();
                },
                {
                  defaultErrorMessage: "Erro ao travar saque",
                },
              );
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Confirmar bloqueio
          </button>
        </div>
      </div>
    </div>
  );
}
