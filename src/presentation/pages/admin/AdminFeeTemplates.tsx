import type { IGetFullSellerFeeResponseDto } from "@/infra/http/services/api/modules/seller-fee.module";
import ModalPortal from "@/presentation/components/ModalPortal";
import PageHeader from "@/presentation/components/PageHeader";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerFeeTemplatesQuery from "@/presentation/hooks/use-seller-fee-templates-query";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { Layers, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface IDeleteConfirmModalProps {
  template: IGetFullSellerFeeResponseDto;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirmModal({
  template,
  onClose,
  onDeleted,
}: IDeleteConfirmModalProps) {
  const apiService = useApiService();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await tryOrToastError(
      async () => {
        await apiService.modules.sellerFee.deleteSellerFee(template.id);
        toast.success(`Plano "${template.name}" excluído`);
        onDeleted();
        onClose();
      },
      {
        defaultErrorMessage: "Erro ao excluir plano",
        finallyFn: () => setDeleting(false),
      },
    );
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div
          className="liquid-glass-control w-full max-w-md animate-fade-in rounded-[22px] p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
            <Trash2 size={20} className="text-destructive" />
          </div>
          <h3 className="mb-1 text-lg font-bold tracking-tight text-foreground">
            Excluir plano
          </h3>
          <p className="mb-5 text-sm text-muted-foreground">
            Tem certeza que deseja excluir o plano{" "}
            <strong className="text-foreground">"{template.name}"</strong>? Esta
            ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deleting && <Loader2 size={15} className="animate-spin" />}
              Excluir
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function formatBillingGoal(value: number) {
  if (value <= 0) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export default function AdminFeeTemplates() {
  const navigate = useNavigate();
  const { data: templates, isLoading, invalidateQuery } =
    useSellerFeeTemplatesQuery();

  const [deletingTemplate, setDeletingTemplate] =
    useState<IGetFullSellerFeeResponseDto | null>(null);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Sistema"
          title="Planos de taxa"
          description="Gerencie os planos de taxa disponíveis para atribuir aos sellers."
          actions={
            <button
              type="button"
              onClick={() => navigate("/admin/fee-templates/create")}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              Novo plano
            </button>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="admin-surface px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers size={18} className="text-primary" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground">
              Nenhum plano cadastrado
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Crie o primeiro plano para atribuir taxas personalizadas aos
              sellers.
            </p>
            <button
              type="button"
              onClick={() => navigate("/admin/fee-templates/create")}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              Novo plano
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="admin-surface p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Layers size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">
                        {template.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                          Pix {template.pixVariableFee}%
                        </span>
                        <span className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                          Saque {template.withdrawalVariableFee}%
                        </span>
                        <span className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                          Meta {formatBillingGoal(template.billingGoal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/fee-templates/${template.id}`)
                      }
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      title="Editar"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTemplate(template)}
                      className={cn(
                        "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors",
                        "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
                      )}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deletingTemplate && (
        <DeleteConfirmModal
          template={deletingTemplate}
          onClose={() => setDeletingTemplate(null)}
          onDeleted={invalidateQuery}
        />
      )}
    </AdminLayout>
  );
}
