import { useApiService } from "@/presentation/hooks/use-api-service";
import ModalPortal from "@/presentation/components/ModalPortal";
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
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        onClick={() => setShowBlockReasonModal(false)}
      >
        <div
          className="liquid-glass-control w-full max-w-md rounded-[22px] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-1 text-base font-semibold text-foreground">
            Travar saque
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Informe o motivo do bloqueio. O seller verá esta mensagem.
          </p>
          <textarea
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Motivo do bloqueio de saque..."
            className="mb-4 h-24 w-full resize-none rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBlockReasonModal(false)}
              className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
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
              className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Confirmar bloqueio
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
