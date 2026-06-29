import type {
  ICreateSellerFeeRequestDto,
  IGetFullSellerFeeResponseDto,
} from "@/infra/http/services/api/modules/seller-fee.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerFeeTemplatesQuery from "@/presentation/hooks/use-seller-fee-templates-query";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FeeFormField
// ---------------------------------------------------------------------------

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
    <div>
      <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">
        {label}
      </label>
      {isString ? (
        <input
          type="text"
          value={String(form[field])}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      ) : (
        <input
          type="number"
          step={step}
          min={0}
          value={form[field] as number}
          onChange={(e) => onChange(field, Number(e.target.value) || 0)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeeFormSection
// ---------------------------------------------------------------------------

interface IFeeFormSectionProps {
  title: string;
  fields: { label: string; field: keyof TFeeFormState; step?: number }[];
  form: TFeeFormState;
  onChange: (f: keyof TFeeFormState, v: number | string) => void;
}

function FeeFormSection({ title, fields, form, onChange }: IFeeFormSectionProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

// ---------------------------------------------------------------------------
// FeeFormModal
// ---------------------------------------------------------------------------

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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {editing ? "Editar plano" : "Novo plano de taxa"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-5"
        >
          {/* Nome */}
          <div>
            <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block mb-1">
              Nome do plano *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Ex: Padrão, Premium, Especial..."
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          <FeeFormSection
            title="Pix"
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
            title="Cartão de Crédito"
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
            form={form}
            onChange={onChange}
            fields={[
              { label: "Taxa fixa (R$)", field: "withdrawalFixedFee" },
              { label: "Taxa variável (%)", field: "withdrawalVariableFee" },
              { label: "Taxa mínima (R$)", field: "withdrawalMinFee" },
              { label: "Mín. por saque (R$)", field: "withdrawalMinAmount", step: 1 },
              { label: "Máx. por saque (R$)", field: "withdrawalMaxAmount", step: 1 },
              { label: "Limite diário (R$)", field: "withdrawalDailyMax", step: 1 },
            ]}
          />

          <FeeFormSection
            title="Metas"
            form={form}
            onChange={onChange}
            fields={[
              { label: "Meta de faturamento (R$)", field: "billingGoal", step: 1 },
            ]}
          />
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {editing ? "Salvar alterações" : "Criar plano"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmModal
// ---------------------------------------------------------------------------

interface IDeleteConfirmModalProps {
  template: IGetFullSellerFeeResponseDto;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteConfirmModal({ template, onClose, onDeleted }: IDeleteConfirmModalProps) {
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <Trash2 size={18} className="text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Excluir plano</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tem certeza que deseja excluir o plano{" "}
            <strong className="text-foreground">"{template.name}"</strong>? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminFeeTemplates() {
  const { data: templates, isLoading, invalidateQuery } = useSellerFeeTemplatesQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IGetFullSellerFeeResponseDto | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<IGetFullSellerFeeResponseDto | null>(null);

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
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={18} className="text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Planos de taxa</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Gerencie os planos de taxa disponíveis para atribuir aos sellers
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Novo plano
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border/40 overflow-hidden bg-card/30">
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center">
              <Layers size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pix variável
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Saque variável
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Meta fat.
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Layers size={13} className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                      {template.pixVariableFee}%
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                      {template.withdrawalVariableFee}%
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                      {template.billingGoal > 0
                        ? `R$ ${(template.billingGoal / 100).toLocaleString("pt-BR")}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(template)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingTemplate(template)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
