import type {
  ICreateSellerFeeRequestDto,
  IGetFullSellerFeeResponseDto,
} from "@/infra/http/services/api/modules/seller-fee.module";
import PageHeader from "@/presentation/components/PageHeader";
import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerFeeTemplatesQuery from "@/presentation/hooks/use-seller-fee-templates-query";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import {
  ArrowLeft,
  Bitcoin,
  CreditCard,
  FileText,
  Loader2,
  QrCode,
  Target,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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

function templateToForm(editing: IGetFullSellerFeeResponseDto): TFeeFormState {
  return {
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
  };
}

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
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
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

interface IFeeTemplateFormProps {
  editing: IGetFullSellerFeeResponseDto | null;
  onCancel: () => void;
  onSaved: () => void;
}

function FeeTemplateForm({ editing, onCancel, onSaved }: IFeeTemplateFormProps) {
  const apiService = useApiService();
  const [form, setForm] = useState<TFeeFormState>(
    editing ? templateToForm(editing) : { ...EMPTY_FEE_FORM },
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
      },
      {
        defaultErrorMessage: "Erro ao salvar plano",
        finallyFn: () => setSaving(false),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {editing ? "Salvar alterações" : "Criar plano"}
        </button>
      </div>
    </form>
  );
}

export default function AdminFeeTemplateFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreate = !id;

  const { data: templates, isLoading, invalidateQuery } =
    useSellerFeeTemplatesQuery();

  const editing = useMemo(() => {
    if (isCreate || !id) return null;
    return templates.find((t) => String(t.id) === id) ?? null;
  }, [isCreate, id, templates]);

  const goBack = () => navigate("/admin/fee-templates");

  const handleSaved = async () => {
    await invalidateQuery();
    navigate("/admin/fee-templates");
  };

  if (!isCreate && !isLoading && !editing) {
    return <Navigate to="/admin/fee-templates" replace />;
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <div className="mb-5">
          <Link
            to="/admin/fee-templates"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} />
            Voltar para planos
          </Link>
        </div>

        <PageHeader
          eyebrow="Sistema"
          title={isCreate ? "Novo plano de taxa" : "Editar plano"}
          description="Defina taxas por método de pagamento e limites de saque."
        />

        {isLoading && !isCreate ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <FeeTemplateForm
            key={editing?.id ?? "create"}
            editing={editing}
            onCancel={goBack}
            onSaved={handleSaved}
          />
        )}
      </div>
    </AdminLayout>
  );
}
