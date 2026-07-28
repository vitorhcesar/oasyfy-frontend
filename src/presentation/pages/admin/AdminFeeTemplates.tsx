import type {
  ICreateSellerFeeRequestDto,
  IGetFullSellerFeeResponseDto,
} from "@/infra/http/services/api/modules/seller-fee.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerFeeTemplatesQuery from "@/presentation/hooks/use-seller-fee-templates-query";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  Bitcoin,
  CreditCard,
  FileText,
  Layers,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Target,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TFeeFormState = Omit<ICreateSellerFeeRequestDto, never>;

const EMPTY_FEE_FORM: TFeeFormState = {
  name: "",
  pixFixedFee: 0,
  pixVariableFee: 0,
  pixMinFee: 0,
  pixRetentionFee: 0,
  pixRetentionDays: 0,
  cardFixedFee: 0,
  cardVariableFee: 0,
  cardMinFee: 0,
  cardRetentionFee: 0,
  cardRetentionDays: 0,
  boletoFixedFee: 0,
  boletoVariableFee: 0,
  boletoMinFee: 0,
  boletoRetentionFee: 0,
  boletoRetentionDays: 0,
  cryptoFixedFee: 0,
  cryptoVariableFee: 0,
  cryptoMinFee: 0,
  cryptoRetentionFee: 0,
  cryptoRetentionDays: 0,
  withdrawalFixedFee: 0,
  withdrawalVariableFee: 0,
  withdrawalMinFee: 0,
  billingGoal: 0,
  withdrawalMinAmount: 0,
  withdrawalMaxAmount: 0,
  withdrawalDailyMax: 0,
};

interface IFeeFormFieldProps {
  label: string;
  field: keyof TFeeFormState;
  form: TFeeFormState;
  onChange: (f: keyof TFeeFormState, v: number | string) => void;
  step?: number;
  isString?: boolean;
}

function FeeFormField({
  label,
  field,
  form,
  onChange,
  step = 0.01,
  isString,
}: IFeeFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      {isString ? (
        <input
          type="text"
          value={String(form[field])}
          onChange={(e) => onChange(field, e.target.value)}
          className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-sm text-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : (
        <input
          type="number"
          step={step}
          min={0}
          value={form[field] as number}
          onChange={(e) => onChange(field, Number(e.target.value) || 0)}
          className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-sm text-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
    </div>
  );
}

interface IFeeFormSectionProps {
  title: string;
  icon: React.ElementType;
  fields: { label: string; field: keyof TFeeFormState; step?: number }[];
  form: TFeeFormState;
  onChange: (f: keyof TFeeFormState, v: number | string) => void;
}

function FeeFormSection({
  title,
  icon: Icon,
  fields,
  form,
  onChange,
}: IFeeFormSectionProps) {
  return (
    <div className="admin-surface space-y-4 p-4 md:p-5">
      <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Icon size={16} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <FeeFormField
            key={f.field}
            label={f.label}
            field={f.field}
            form={form}
            onChange={onChange}
            step={f.step}
          />
        ))}
      </div>
    </div>
  );
}

interface IFeeFormModalProps {
  editing: IGetFullSellerFeeResponseDto | null;
  onClose: () => void;
  onSaved: () => void;
}

function FeeFormModal({ editing, onClose, onSaved }: IFeeFormModalProps) {
  const apiService = useApiService();
  const [form, setForm] = useState<TFeeFormState>(
    editing
      ? {
          name: editing.name,
          pixFixedFee: editing.pixFixedFee,
          pixVariableFee: editing.pixVariableFee,
          pixMinFee: editing.pixMinFee,
          pixRetentionFee: editing.pixRetentionFee,
          pixRetentionDays: editing.pixRetentionDays,
          cardFixedFee: editing.cardFixedFee,
          cardVariableFee: editing.cardVariableFee,
          cardMinFee: editing.cardMinFee,
          cardRetentionFee: editing.cardRetentionFee,
          cardRetentionDays: editing.cardRetentionDays,
          boletoFixedFee: editing.boletoFixedFee,
          boletoVariableFee: editing.boletoVariableFee,
          boletoMinFee: editing.boletoMinFee,
          boletoRetentionFee: editing.boletoRetentionFee,
          boletoRetentionDays: editing.boletoRetentionDays,
          cryptoFixedFee: editing.cryptoFixedFee,
          cryptoVariableFee: editing.cryptoVariableFee,
          cryptoMinFee: editing.cryptoMinFee,
          cryptoRetentionFee: editing.cryptoRetentionFee,
          cryptoRetentionDays: editing.cryptoRetentionDays,
          withdrawalFixedFee: editing.withdrawalFixedFee,
          withdrawalVariableFee: editing.withdrawalVariableFee,
          withdrawalMinFee: editing.withdrawalMinFee,
          billingGoal: editing.billingGoal,
          withdrawalMinAmount: editing.withdrawalMinAmount,
          withdrawalMaxAmount: editing.withdrawalMaxAmount,
          withdrawalDailyMax: editing.withdrawalDailyMax,
        }
      : { ...EMPTY_FEE_FORM },
  );
  const [saving, setSaving] = useState(false);

  const onChange = (field: keyof TFeeFormState, value: number | string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe um nome para o plano");
      return;
    }
    setSaving(true);
    await tryOrToastError(
      async () => {
        if (editing) {
          await apiService.modules.sellerFee.updateSellerFee({
            id: String(editing.id),
            ...form,
          });
          toast.success("Plano atualizado!");
        } else {
          await apiService.modules.sellerFee.createSellerFee(form);
          toast.success("Plano criado!");
        }
        onSaved();
        onClose();
      },
      {
        defaultErrorMessage: "Erro ao salvar plano",
        finallyFn: () => setSaving(false),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="liquid-glass-control flex max-h-[90vh] w-full max-w-3xl animate-fade-in flex-col overflow-hidden rounded-[22px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Layers size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {editing ? "Editar plano" : "Novo plano de taxa"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Defina taxas por método de pagamento e limites de saque.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4 md:px-6"
        >
          <div className="admin-surface p-4 md:p-5">
            <FeeFormField
              label="Nome do plano *"
              field="name"
              form={form}
              onChange={onChange}
              isString
            />
          </div>

          <FeeFormSection
            title="Pix"
            icon={QrCode}
            form={form}
            onChange={onChange}
            fields={[
              { label: "Taxa fixa (R$)", field: "pixFixedFee" },
              { label: "Taxa variável (%)", field: "pixVariableFee" },
              { label: "Taxa mínima (R$)", field: "pixMinFee" },
              { label: "Retenção (%)", field: "pixRetentionFee" },
              { label: "Dias retenção", field: "pixRetentionDays", step: 1 },
            ]}
          />

          <FeeFormSection
            title="Cartão de crédito"
            icon={CreditCard}
            form={form}
            onChange={onChange}
            fields={[
              { label: "Taxa fixa (R$)", field: "cardFixedFee" },
              { label: "Taxa variável (%)", field: "cardVariableFee" },
              { label: "Taxa mínima (R$)", field: "cardMinFee" },
              { label: "Retenção (%)", field: "cardRetentionFee" },
              { label: "Dias retenção", field: "cardRetentionDays", step: 1 },
            ]}
          />

          <FeeFormSection
            title="Boleto"
            icon={FileText}
            form={form}
            onChange={onChange}
            fields={[
              { label: "Taxa fixa (R$)", field: "boletoFixedFee" },
              { label: "Taxa variável (%)", field: "boletoVariableFee" },
              { label: "Taxa mínima (R$)", field: "boletoMinFee" },
              { label: "Retenção (%)", field: "boletoRetentionFee" },
              { label: "Dias retenção", field: "boletoRetentionDays", step: 1 },
            ]}
          />

          <FeeFormSection
            title="Cripto"
            icon={Bitcoin}
            form={form}
            onChange={onChange}
            fields={[
              { label: "Taxa fixa (R$)", field: "cryptoFixedFee" },
              { label: "Taxa variável (%)", field: "cryptoVariableFee" },
              { label: "Taxa mínima (R$)", field: "cryptoMinFee" },
              { label: "Retenção (%)", field: "cryptoRetentionFee" },
              { label: "Dias retenção", field: "cryptoRetentionDays", step: 1 },
            ]}
          />

          <FeeFormSection
            title="Saque"
            icon={Wallet}
            form={form}
            onChange={onChange}
            fields={[
              { label: "Taxa fixa (R$)", field: "withdrawalFixedFee" },
              { label: "Taxa variável (%)", field: "withdrawalVariableFee" },
              { label: "Taxa mínima (R$)", field: "withdrawalMinFee" },
              {
                label: "Mín. por saque (R$)",
                field: "withdrawalMinAmount",
                step: 1,
              },
              {
                label: "Máx. por saque (R$)",
                field: "withdrawalMaxAmount",
                step: 1,
              },
              {
                label: "Limite diário (R$)",
                field: "withdrawalDailyMax",
                step: 1,
              },
            ]}
          />

          <FeeFormSection
            title="Metas"
            icon={Target}
            form={form}
            onChange={onChange}
            fields={[
              {
                label: "Meta de faturamento (R$)",
                field: "billingGoal",
                step: 1,
              },
            ]}
          />
        </form>

        <div className="flex justify-end gap-2 border-t border-border/40 px-5 py-4 md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {editing ? "Salvar alterações" : "Criar plano"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
  const { data: templates, isLoading, invalidateQuery } =
    useSellerFeeTemplatesQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<IGetFullSellerFeeResponseDto | null>(null);
  const [deletingTemplate, setDeletingTemplate] =
    useState<IGetFullSellerFeeResponseDto | null>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleOpenEdit = (template: IGetFullSellerFeeResponseDto) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Sistema
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
                Planos de taxa
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Gerencie os planos de taxa disponíveis para atribuir aos
                sellers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              Novo plano
            </button>
          </div>
        </header>

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
              onClick={handleOpenCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90"
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
                      onClick={() => handleOpenEdit(template)}
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

      {showForm && (
        <FeeFormModal
          editing={editingTemplate}
          onClose={handleClose}
          onSaved={invalidateQuery}
        />
      )}

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
