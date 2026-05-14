import { useState } from "react";
import { COMPANY_TYPE_OPTIONS } from "./constants/company-type-options";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import { formatCnpj } from "./utils/format-cnpj";
import { formatCpf } from "./utils/format-cpf";
import { formatPhone } from "./utils/format-phone";
import { isValidCnpj } from "./utils/is-valid-cnpj";
import { isValidCpf } from "./utils/is-valid-cpf";
import ValidationBadge from "./ValidationBadge";

const REVENUE_OPTIONS = [
  "Até R$ 5.000",
  "R$ 5.000 a R$ 20.000",
  "R$ 20.000 a R$ 50.000",
  "R$ 50.000 a R$ 100.000",
  "Acima de R$ 100.000",
];

interface IPersonalStepProps {
  labelClass: string;
  inputClass: string;
}

export default function PersonalStep({
  labelClass,
  inputClass,
}: IPersonalStepProps) {
  const { form, isPj, setFormDataValue } = useKycOnboardingStore();

  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);

  const handleCpfChange = (v: string) => {
    const formatted = formatCpf(v);
    setFormDataValue("cpf", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11) {
      setCpfValid(isValidCpf(digits));
    } else {
      setCpfValid(null);
    }
  };

  const handleCnpjChange = (v: string) => {
    const formatted = formatCnpj(v);
    setFormDataValue("cnpj", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 14) {
      setCnpjValid(isValidCnpj(digits));
    } else {
      setCnpjValid(null);
    }
  };

  return (
    <div className="space-y-5 animate-step-slide">
      <div>
        <label className={labelClass}>Nome completo</label>
        <input
          className={inputClass}
          value={form.fullName}
          onChange={(e) => setFormDataValue("fullName", e.target.value)}
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
                  setFormDataValue("phone", formatPhone(e.target.value))
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
              onChange={(e) => setFormDataValue("companyName", e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
          <div>
            <label className={labelClass}>Tipo de Empresa</label>
            <select
              className={inputClass}
              value={form.companyType}
              onChange={(e) => setFormDataValue("companyType", e.target.value)}
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
              onChange={(e) => setFormDataValue("tradingName", e.target.value)}
              placeholder="Nome fantasia (opcional)"
            />
          </div>
          <div>
            <label className={labelClass}>Atividade Principal</label>
            <input
              className={inputClass}
              value={form.businessActivity}
              onChange={(e) =>
                setFormDataValue("businessActivity", e.target.value)
              }
              placeholder="Ex: Comércio varejista"
            />
          </div>
          <div>
            <label className={labelClass}>Faturamento Mensal</label>
            <select
              className={inputClass}
              value={form.monthlyRevenue}
              onChange={(e) =>
                setFormDataValue("monthlyRevenue", e.target.value)
              }
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
                  setFormDataValue("phone", formatPhone(e.target.value))
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
              onChange={(e) => setFormDataValue("dateOfBirth", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
