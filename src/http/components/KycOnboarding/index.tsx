import { RippleButton } from "@/http/components/ui/ripple-button";
import { useAuthStore } from "@/http/stores/useAuthStore";
import { supabase } from "@/infra/integrations/supabase/client";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  Landmark,
  Loader2,
  Pencil,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

type TPersonType = "pf" | "pj";
type TStep = "type" | "personal" | "address" | "documents" | "bank" | "review";

const STEPS: TStep[] = [
  "type",
  "personal",
  "address",
  "documents",
  "bank",
  "review",
];
const STEP_LABELS: Record<TStep, string> = {
  type: "Tipo",
  personal: "Dados",
  address: "Endereço",
  documents: "Documentos",
  bank: "Banco",
  review: "Revisão",
};
// const STEP_ICONS: Record<Step, typeof User> = {
//   type: User,
//   personal: FileText,
//   address: MapPin,
//   documents: Camera,
//   bank: Landmark,
//   review: CheckCircle2,
// };

const COMPANY_TYPE_OPTIONS = [
  { value: "mei", label: "MEI — Microempreendedor Individual" },
  { value: "me", label: "ME — Microempresa" },
  { value: "epp", label: "EPP — Empresa de Pequeno Porte" },
  { value: "ltda", label: "LTDA — Sociedade Limitada" },
  { value: "sa", label: "SA — Sociedade Anônima" },
  { value: "eireli", label: "EIRELI — Empresa Individual" },
  { value: "slu", label: "SLU — Sociedade Limitada Unipessoal" },
  { value: "other", label: "Outro" },
];

const REVENUE_OPTIONS = [
  "Até R$ 5.000",
  "R$ 5.000 a R$ 20.000",
  "R$ 20.000 a R$ 50.000",
  "R$ 50.000 a R$ 100.000",
  "Acima de R$ 100.000",
];

const STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

interface IBankData {
  bankName: string;
  agency: string;
  agencyDigit: string;
  account: string;
  accountDigit: string;
  accountType: "corrente" | "poupanca" | "";
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "random" | "";
  pixKey: string;
}

interface IFormData {
  personType: TPersonType | null;
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  phone: string;
  companyName: string;
  companyType: string;
  cnpj: string;
  tradingName: string;
  businessActivity: string;
  monthlyRevenue: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  bank: IBankData;
}

interface IUploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  url: string | null;
}

const initialBank: IBankData = {
  bankName: "",
  agency: "",
  agencyDigit: "",
  account: "",
  accountDigit: "",
  accountType: "",
  pixKeyType: "",
  pixKey: "",
};

const initialForm: IFormData = {
  personType: null,
  fullName: "",
  cpf: "",
  dateOfBirth: "",
  phone: "",
  companyName: "",
  companyType: "",
  cnpj: "",
  tradingName: "",
  businessActivity: "",
  monthlyRevenue: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  bank: { ...initialBank },
};

// CPF validation (algorithmic check)
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // all same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[10]) !== check) return false;

  return true;
}

// CNPJ validation (algorithmic check)
function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(digits[12]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(digits[13]) !== check) return false;

  return true;
}

interface IKycOnboardingProps {
  onComplete: () => void;
}

export default function KycOnboarding({ onComplete }: IKycOnboardingProps) {
  const { user } = useAuthStore();

  const [step, setStep] = useState<TStep>("type");
  const [form, setForm] = useState<IFormData>(initialForm);
  const [files, setFiles] = useState<Record<string, IUploadedFile>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);

  const currentIndex = STEPS.indexOf(step);
  const isPj = form.personType === "pj";

  const set = (field: keyof IFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const setBank = (field: keyof IBankData, value: string) => {
    setForm((prev) => ({ ...prev, bank: { ...prev.bank, [field]: value } }));
    setError("");
  };

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const formatCnpj = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12)
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(
      8,
      12
    )}-${d.slice(12)}`;
  };

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleCpfChange = (v: string) => {
    const formatted = formatCpf(v);
    set("cpf", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11) {
      setCpfValid(isValidCpf(digits));
    } else {
      setCpfValid(null);
    }
  };

  const handleCnpjChange = (v: string) => {
    const formatted = formatCnpj(v);
    set("cnpj", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 14) {
      setCnpjValid(isValidCnpj(digits));
    } else {
      setCnpjValid(null);
    }
  };

  const handleFileSelect = useCallback(
    async (key: string, file: File) => {
      if (!user) return;
      const preview = URL.createObjectURL(file);
      setFiles((prev) => ({
        ...prev,
        [key]: { file, preview, uploading: true, url: null },
      }));

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("kyc-documents")
        .upload(path, file);

      if (upErr) {
        setFiles((prev) => ({
          ...prev,
          [key]: { ...prev[key], uploading: false },
        }));
        setError(`Erro ao enviar ${key}: ${upErr.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(path);
      setFiles((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          uploading: false,
          url: urlData.publicUrl || path,
        },
      }));
    },
    [user]
  );

  const removeFile = (key: string) => {
    if (files[key]?.preview) URL.revokeObjectURL(files[key].preview);
    setFiles((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  const validateStep = (): boolean => {
    switch (step) {
      case "type":
        if (!form.personType) {
          setError("Selecione o tipo de pessoa");
          return false;
        }
        return true;
      case "personal":
        if (!form.fullName.trim()) {
          setError("Nome completo é obrigatório");
          return false;
        }
        if (isPj) {
          if (!form.cnpj || form.cnpj.replace(/\D/g, "").length < 14) {
            setError("CNPJ incompleto");
            return false;
          }
          if (!isValidCnpj(form.cnpj)) {
            setError("CNPJ inválido — verifique os dígitos");
            return false;
          }
          if (!form.companyName.trim()) {
            setError("Razão social é obrigatória");
            return false;
          }
          if (!form.companyType) {
            setError("Tipo de empresa é obrigatório");
            return false;
          }
        } else {
          if (!form.cpf || form.cpf.replace(/\D/g, "").length < 11) {
            setError("CPF incompleto");
            return false;
          }
          if (!isValidCpf(form.cpf)) {
            setError("CPF inválido — verifique os dígitos");
            return false;
          }
          if (!form.dateOfBirth) {
            setError("Data de nascimento é obrigatória");
            return false;
          }
        }
        if (!form.phone || form.phone.replace(/\D/g, "").length < 10) {
          setError("Telefone inválido");
          return false;
        }
        return true;
      case "address":
        if (!form.zipCode || form.zipCode.replace(/\D/g, "").length < 8) {
          setError("CEP inválido");
          return false;
        }
        if (!form.street.trim()) {
          setError("Rua é obrigatória");
          return false;
        }
        if (!form.number.trim()) {
          setError("Número é obrigatório");
          return false;
        }
        if (!form.neighborhood.trim()) {
          setError("Bairro é obrigatório");
          return false;
        }
        if (!form.city.trim()) {
          setError("Cidade é obrigatória");
          return false;
        }
        if (!form.state) {
          setError("Estado é obrigatório");
          return false;
        }
        return true;
      case "documents":
        if (!files.document_front) {
          setError("Documento (frente) é obrigatório");
          return false;
        }
        if (!files.document_back) {
          setError("Documento (verso) é obrigatório");
          return false;
        }
        if (!files.selfie) {
          setError("Selfie é obrigatória");
          return false;
        }
        if (!files.proof_of_address) {
          setError("Comprovante de endereço é obrigatório");
          return false;
        }
        if (isPj && !files.company_contract) {
          setError("Contrato social é obrigatório");
          return false;
        }
        if (Object.values(files).some((f) => f.uploading)) {
          setError("Aguarde o envio dos arquivos");
          return false;
        }
        return true;
      case "bank":
        if (!form.bank.bankName.trim()) {
          setError("Nome do banco é obrigatório");
          return false;
        }
        if (!form.bank.agency.trim()) {
          setError("Agência é obrigatória");
          return false;
        }
        if (!form.bank.account.trim()) {
          setError("Conta é obrigatória");
          return false;
        }
        if (!form.bank.accountType) {
          setError("Tipo de conta é obrigatório");
          return false;
        }
        if (!form.bank.pixKeyType) {
          setError("Tipo de chave PIX é obrigatório");
          return false;
        }
        if (!form.bank.pixKey.trim()) {
          setError("Chave PIX é obrigatória");
          return false;
        }
        // Validate PIX key format
        if (form.bank.pixKeyType === "cpf") {
          if (!isValidCpf(form.bank.pixKey)) {
            setError("CPF da chave PIX é inválido");
            return false;
          }
        } else if (form.bank.pixKeyType === "cnpj") {
          if (!isValidCnpj(form.bank.pixKey)) {
            setError("CNPJ da chave PIX é inválido");
            return false;
          }
        } else if (form.bank.pixKeyType === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(form.bank.pixKey)) {
            setError("E-mail da chave PIX é inválido");
            return false;
          }
        } else if (form.bank.pixKeyType === "phone") {
          if (form.bank.pixKey.replace(/\D/g, "").length < 10) {
            setError("Telefone da chave PIX é inválido");
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (currentIndex < STEPS.length - 1) setStep(STEPS[currentIndex + 1]);
  };
  const prev = () => {
    if (currentIndex > 0) setStep(STEPS[currentIndex - 1]);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setError("");

    const { error: dbErr } = await supabase.from("kyc_submissions").insert({
      user_id: user.id,
      email: user.email || null,
      person_type: form.personType!,
      full_name: form.fullName,
      cpf: form.cpf || null,
      date_of_birth: form.dateOfBirth || null,
      phone: form.phone,
      company_name: form.companyName || null,
      company_type: form.companyType || null,
      cnpj: form.cnpj || null,
      trading_name: form.tradingName || null,
      business_activity: form.businessActivity || null,
      monthly_revenue: form.monthlyRevenue || null,
      zip_code: form.zipCode,
      street: form.street,
      number: form.number,
      complement: form.complement || null,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      document_front_url: files.document_front?.url || null,
      document_back_url: files.document_back?.url || null,
      selfie_url: files.selfie?.url || null,
      proof_of_address_url: files.proof_of_address?.url || null,
      company_contract_url: files.company_contract?.url || null,
      bank_data: form.bank as any,
      status: "under_review",
    });

    if (dbErr) {
      setError(dbErr.message);
      setSubmitting(false);
      return;
    }
    onComplete();
  };

  const [cepLoading, setCepLoading] = useState(false);
  const [cepValid, setCepValid] = useState<boolean | null>(null);

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepValid(null);
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        setCepValid(true);
      } else {
        setCepValid(false);
      }
    } catch {
      setCepValid(false);
    }
    setCepLoading(false);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all text-foreground placeholder:text-muted-foreground/50";
  const labelClass =
    "block text-xs md:text-sm font-medium text-muted-foreground mb-1.5 tracking-wide";

  const ValidationBadge = ({ valid }: { valid: boolean | null }) => {
    if (valid === null) return null;
    return valid ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={10} />
        Válido
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
        <AlertCircle size={10} />
        Inválido
      </span>
    );
  };

  const FileUploadBox = ({
    id,
    label,
    accept = "image/*,.pdf",
  }: {
    id: string;
    label: string;
    accept?: string;
  }) => {
    const f = files[id];
    return (
      <div>
        <label className={labelClass}>{label}</label>
        {f ? (
          <label className="relative rounded-xl border border-border/60 bg-card p-3 flex items-center gap-3 group hover:border-primary/30 transition-colors cursor-pointer">
            {f.preview && f.file.type.startsWith("image/") ? (
              <img
                src={f.preview}
                alt=""
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                <FileText size={22} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {f.file.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {f.uploading ? (
                  <span className="text-primary flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Enviando...
                  </span>
                ) : f.url ? (
                  <span className="text-primary flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Toque para trocar
                  </span>
                ) : (
                  "Erro no envio"
                )}
              </p>
            </div>
            {!f.uploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFile(id);
                }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <input
              type="file"
              accept={accept}
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  removeFile(id);
                  handleFileSelect(id, e.target.files[0]);
                }
              }}
            />
          </label>
        ) : (
          <label className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={18} className="text-primary" />
            </div>
            <div className="text-center">
              <span className="text-xs font-medium text-foreground">
                Clique para enviar
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG ou PDF até 10MB
              </p>
            </div>
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(id, e.target.files[0])
              }
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-backdrop-enter" />

      <div className="relative w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-lg overflow-hidden animate-modal-enter max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-7 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="text-primary" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Verificação de Identidade
              </h2>
              <p className="text-xs text-muted-foreground">
                Preencha seus dados para ativar sua conta
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-5">
            {STEPS.map((s, i) => {
              const isActive = i === currentIndex;
              const isDone = i < currentIndex;
              return (
                <div
                  key={s}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-full h-1 rounded-full transition-all duration-500 ${
                      isDone
                        ? "bg-primary"
                        : isActive
                        ? "bg-primary/50"
                        : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isDone
                        ? "text-primary"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {STEP_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-4">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 animate-step-slide">
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step: Type */}
          {step === "type" && (
            <div className="space-y-5 animate-step-slide">
              <p className="text-sm text-muted-foreground">
                Como você vai operar na plataforma?
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    ["pf", "Pessoa Física", "CPF, RG e dados pessoais", User],
                    [
                      "pj",
                      "Pessoa Jurídica",
                      "CNPJ, contrato social e dados da empresa",
                      Building2,
                    ],
                  ] as const
                ).map(([type, title, desc, Icon]) => (
                  <RippleButton
                    key={type}
                    onClick={() => {
                      set("personType", type);
                      setError("");
                    }}
                    rippleColor="rgba(0,0,0,0.06)"
                    className={`group p-5 rounded-xl border text-left transition-all duration-200 ${
                      form.personType === type
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all ${
                        form.personType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:text-primary"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </RippleButton>
                ))}
              </div>
            </div>
          )}

          {/* Step: Personal */}
          {step === "personal" && (
            <div className="space-y-5 animate-step-slide">
              <div>
                <label className={labelClass}>Nome completo</label>
                <input
                  className={inputClass}
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              {isPj ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                          CNPJ
                        </label>
                        <ValidationBadge valid={cnpjValid} />
                      </div>
                      <input
                        className={`${inputClass} ${
                          cnpjValid === false
                            ? "border-destructive/50 focus:ring-destructive/30"
                            : cnpjValid === true
                            ? "border-primary/50 focus:ring-primary/30"
                            : ""
                        }`}
                        value={form.cnpj}
                        onChange={(e) => handleCnpjChange(e.target.value)}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone</label>
                      <input
                        className={inputClass}
                        value={form.phone}
                        onChange={(e) =>
                          set("phone", formatPhone(e.target.value))
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Razão Social</label>
                    <input
                      className={inputClass}
                      value={form.companyName}
                      onChange={(e) => set("companyName", e.target.value)}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Empresa</label>
                    <select
                      className={inputClass}
                      value={form.companyType}
                      onChange={(e) => set("companyType", e.target.value)}
                    >
                      <option value="">Selecione o tipo</option>
                      {COMPANY_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Nome Fantasia</label>
                    <input
                      className={inputClass}
                      value={form.tradingName}
                      onChange={(e) => set("tradingName", e.target.value)}
                      placeholder="Nome fantasia (opcional)"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Atividade Principal</label>
                    <input
                      className={inputClass}
                      value={form.businessActivity}
                      onChange={(e) => set("businessActivity", e.target.value)}
                      placeholder="Ex: Comércio varejista"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Faturamento Mensal</label>
                    <select
                      className={inputClass}
                      value={form.monthlyRevenue}
                      onChange={(e) => set("monthlyRevenue", e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {REVENUE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                          CPF
                        </label>
                        <ValidationBadge valid={cpfValid} />
                      </div>
                      <input
                        className={`${inputClass} ${
                          cpfValid === false
                            ? "border-destructive/50 focus:ring-destructive/30"
                            : cpfValid === true
                            ? "border-primary/50 focus:ring-primary/30"
                            : ""
                        }`}
                        value={form.cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone</label>
                      <input
                        className={inputClass}
                        value={form.phone}
                        onChange={(e) =>
                          set("phone", formatPhone(e.target.value))
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Data de Nascimento</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.dateOfBirth}
                      onChange={(e) => set("dateOfBirth", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step: Address */}
          {step === "address" && (
            <div className="space-y-5 animate-step-slide">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>
                    CEP{" "}
                    {cepLoading ? (
                      <Loader2 size={10} className="inline animate-spin ml-1" />
                    ) : (
                      <ValidationBadge valid={cepValid} />
                    )}
                  </label>
                  <input
                    className={inputClass}
                    value={form.zipCode}
                    onChange={(e) => {
                      const v = formatCep(e.target.value);
                      set("zipCode", v);
                      lookupCep(v);
                    }}
                    placeholder="00000-000"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Rua / Avenida</label>
                  <input
                    className={inputClass}
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    placeholder="Rua / Avenida"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Número</label>
                  <input
                    className={inputClass}
                    value={form.number}
                    onChange={(e) => set("number", e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Complemento</label>
                  <input
                    className={inputClass}
                    value={form.complement}
                    onChange={(e) => set("complement", e.target.value)}
                    placeholder="Apto, sala (opcional)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input
                    className={inputClass}
                    value={form.neighborhood}
                    onChange={(e) => set("neighborhood", e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className={labelClass}>Estado</label>
                  <select
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">UF</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step: Documents */}
          {step === "documents" && (
            <div className="space-y-5 animate-step-slide">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Camera size={18} className="text-primary flex-shrink-0" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Envie fotos nítidas e legíveis. Documentos borrados ou
                  cortados serão rejeitados.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FileUploadBox
                  id="document_front"
                  label={
                    isPj
                      ? "RG/CNH do Representante (Frente)"
                      : "RG ou CNH (Frente)"
                  }
                />
                <FileUploadBox
                  id="document_back"
                  label={
                    isPj
                      ? "RG/CNH do Representante (Verso)"
                      : "RG ou CNH (Verso)"
                  }
                />
              </div>
              <FileUploadBox
                id="selfie"
                label="Selfie segurando o documento"
                accept="image/*"
              />
              <FileUploadBox
                id="proof_of_address"
                label="Comprovante de Endereço (últimos 3 meses)"
              />
              {isPj && (
                <FileUploadBox
                  id="company_contract"
                  label="Contrato Social ou Requerimento de Empresário"
                  accept="image/*,.pdf"
                />
              )}
            </div>
          )}

          {/* Step: Bank */}
          {step === "bank" && (
            <div className="space-y-5 animate-step-slide">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Landmark size={18} className="text-primary flex-shrink-0" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Informe os dados bancários para recebimento. Certifique-se de
                  que a conta está no seu nome ou da sua empresa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Nome do Banco</label>
                  <input
                    className={inputClass}
                    value={form.bank.bankName}
                    onChange={(e) => setBank("bankName", e.target.value)}
                    placeholder="Ex: Nubank, Itaú, Bradesco"
                  />
                </div>
                <div>
                  <label className={labelClass}>Agência</label>
                  <input
                    className={inputClass}
                    value={form.bank.agency}
                    onChange={(e) =>
                      setBank(
                        "agency",
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    placeholder="0001"
                  />
                </div>
                <div>
                  <label className={labelClass}>Dígito da Agência</label>
                  <input
                    className={inputClass}
                    value={form.bank.agencyDigit}
                    onChange={(e) =>
                      setBank(
                        "agencyDigit",
                        e.target.value.replace(/\D/g, "").slice(0, 2)
                      )
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Conta</label>
                  <input
                    className={inputClass}
                    value={form.bank.account}
                    onChange={(e) =>
                      setBank(
                        "account",
                        e.target.value.replace(/\D/g, "").slice(0, 12)
                      )
                    }
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className={labelClass}>Dígito da Conta</label>
                  <input
                    className={inputClass}
                    value={form.bank.accountDigit}
                    onChange={(e) =>
                      setBank(
                        "accountDigit",
                        e.target.value.replace(/\D/g, "").slice(0, 2)
                      )
                    }
                    placeholder="0"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Tipo de Conta</label>
                  <select
                    className={inputClass}
                    value={form.bank.accountType}
                    onChange={(e) => setBank("accountType", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Conta Poupança</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-5 space-y-4">
                <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
                  Chave PIX
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Tipo da Chave</label>
                    <select
                      className={inputClass}
                      value={form.bank.pixKeyType}
                      onChange={(e) => {
                        setBank("pixKeyType", e.target.value);
                        setBank("pixKey", "");
                      }}
                    >
                      <option value="">Selecione</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide">
                        Chave PIX
                      </label>
                      {form.bank.pixKey.trim() &&
                        ["cpf", "cnpj", "email", "phone"].includes(
                          form.bank.pixKeyType
                        ) && (
                          <ValidationBadge
                            valid={
                              form.bank.pixKeyType === "cpf"
                                ? form.bank.pixKey.replace(/\D/g, "").length ===
                                  11
                                  ? isValidCpf(form.bank.pixKey)
                                  : null
                                : form.bank.pixKeyType === "cnpj"
                                ? form.bank.pixKey.replace(/\D/g, "").length ===
                                  14
                                  ? isValidCnpj(form.bank.pixKey)
                                  : null
                                : form.bank.pixKeyType === "email"
                                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                    form.bank.pixKey
                                  )
                                : form.bank.pixKeyType === "phone"
                                ? form.bank.pixKey.replace(/\D/g, "").length >=
                                  10
                                : null
                            }
                          />
                        )}
                    </div>
                    <input
                      className={inputClass}
                      value={form.bank.pixKey}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (form.bank.pixKeyType === "cpf") v = formatCpf(v);
                        else if (form.bank.pixKeyType === "cnpj")
                          v = formatCnpj(v);
                        else if (form.bank.pixKeyType === "phone")
                          v = formatPhone(v);
                        setBank("pixKey", v);
                      }}
                      placeholder={
                        form.bank.pixKeyType === "cpf"
                          ? "000.000.000-00"
                          : form.bank.pixKeyType === "cnpj"
                          ? "00.000.000/0000-00"
                          : form.bank.pixKeyType === "email"
                          ? "email@exemplo.com"
                          : form.bank.pixKeyType === "phone"
                          ? "(11) 99999-9999"
                          : "Cole sua chave aleatória"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4 animate-step-slide">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10 mb-2">
                <CheckCircle2
                  size={18}
                  className="text-primary flex-shrink-0"
                />
                <p className="text-xs text-foreground/80 leading-relaxed">
                  Revise todos os dados com atenção. Após o envio, não será
                  possível editar.
                </p>
              </div>

              <div
                onClick={() => setStep("type")}
                className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Tipo de Pessoa
                  </h4>
                  <Pencil
                    size={12}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {isPj ? "🏢 Pessoa Jurídica" : "👤 Pessoa Física"}
                </p>
              </div>

              <div
                onClick={() => setStep("personal")}
                className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Dados Pessoais
                  </h4>
                  <Pencil
                    size={12}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Nome</span>
                    <p className="font-medium text-foreground">
                      {form.fullName}
                    </p>
                  </div>
                  {isPj ? (
                    <>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          CNPJ
                        </span>
                        <p className="font-medium text-foreground">
                          {form.cnpj}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Razão Social
                        </span>
                        <p className="font-medium text-foreground">
                          {form.companyName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Tipo de Empresa
                        </span>
                        <p className="font-medium text-foreground">
                          {COMPANY_TYPE_OPTIONS.find(
                            (o) => o.value === form.companyType
                          )?.label || form.companyType}
                        </p>
                      </div>
                      {form.tradingName && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Fantasia
                          </span>
                          <p className="font-medium text-foreground">
                            {form.tradingName}
                          </p>
                        </div>
                      )}
                      {form.businessActivity && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Atividade
                          </span>
                          <p className="font-medium text-foreground">
                            {form.businessActivity}
                          </p>
                        </div>
                      )}
                      {form.monthlyRevenue && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Faturamento
                          </span>
                          <p className="font-medium text-foreground">
                            {form.monthlyRevenue}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          CPF
                        </span>
                        <p className="font-medium text-foreground">
                          {form.cpf}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">
                          Nascimento
                        </span>
                        <p className="font-medium text-foreground">
                          {form.dateOfBirth}
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Telefone
                    </span>
                    <p className="font-medium text-foreground">{form.phone}</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStep("address")}
                className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Endereço
                  </h4>
                  <Pencil
                    size={12}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {form.street}, {form.number}
                  {form.complement ? `, ${form.complement}` : ""}
                  <br />
                  {form.neighborhood} — {form.city}/{form.state}
                  <br />
                  CEP {form.zipCode}
                </p>
              </div>

              <div
                onClick={() => setStep("documents")}
                className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Documentos Enviados
                  </h4>
                  <Pencil
                    size={12}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(files).map(([key]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 text-xs text-primary font-semibold border border-primary/15"
                    >
                      <CheckCircle2 size={12} />
                      {key.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              </div>

              <div
                onClick={() => setStep("bank")}
                className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Dados Bancários
                  </h4>
                  <Pencil
                    size={12}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Banco</span>
                    <p className="font-medium text-foreground">
                      {form.bank.bankName}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Agência
                    </span>
                    <p className="font-medium text-foreground">
                      {form.bank.agency}
                      {form.bank.agencyDigit ? `-${form.bank.agencyDigit}` : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Conta</span>
                    <p className="font-medium text-foreground">
                      {form.bank.account}-{form.bank.accountDigit} (
                      {form.bank.accountType === "corrente"
                        ? "Corrente"
                        : "Poupança"}
                      )
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Chave PIX ({form.bank.pixKeyType?.toUpperCase()})
                    </span>
                    <p className="font-medium text-foreground truncate">
                      {form.bank.pixKey}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-border/60 flex items-center justify-between">
          {currentIndex > 0 ? (
            <RippleButton
              onClick={prev}
              rippleColor="rgba(0,0,0,0.08)"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-[0.97]"
            >
              <ArrowLeft size={15} /> Voltar
            </RippleButton>
          ) : (
            <div />
          )}

          {step === "review" ? (
            <RippleButton
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.97]"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {submitting ? "Enviando..." : "Enviar para Análise"}
            </RippleButton>
          ) : (
            <RippleButton
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.97]"
            >
              Continuar <ArrowRight size={15} />
            </RippleButton>
          )}
        </div>
      </div>
    </div>
  );
}
