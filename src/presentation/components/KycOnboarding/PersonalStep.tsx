import { cn } from "@/presentation/utils/cn";
import { useState } from "react";
import { Input } from "../Input";
import { Label } from "../Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select";
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

export default function PersonalStep() {
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
        <Label htmlFor="fullName">Nome completo</Label>
        <Input
          id="fullName"
          value={form.fullName}
          onChange={(e) => setFormDataValue("fullName", e.target.value)}
          placeholder="Seu nome completo"
        />
      </div>

      {isPj() ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label
                  htmlFor="cnpj"
                  className="text-xs font-semibold text-foreground/70 uppercase tracking-wider"
                >
                  CNPJ
                </Label>
                <ValidationBadge valid={cnpjValid} />
              </div>
              <Input
                id="cnpj"
                className={cn(
                  cnpjValid === false
                    ? "border-destructive/50 focus:ring-destructive/30"
                    : cnpjValid === true
                      ? "border-primary/50 focus:ring-primary/30"
                      : "",
                )}
                value={form.cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setFormDataValue("phone", formatPhone(e.target.value))
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="companyName">Razão Social</Label>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => setFormDataValue("companyName", e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
          <div>
            <Label htmlFor="companyType">Tipo de Empresa</Label>
            <Select
              value={form.companyType || undefined}
              onValueChange={(value) => setFormDataValue("companyType", value)}
            >
              <SelectTrigger id="companyType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tradingName">Nome Fantasia</Label>
            <Input
              id="tradingName"
              value={form.tradingName}
              onChange={(e) => setFormDataValue("tradingName", e.target.value)}
              placeholder="Nome fantasia (opcional)"
            />
          </div>
          <div>
            <Label htmlFor="businessActivity">Atividade Principal</Label>
            <Input
              id="businessActivity"
              value={form.businessActivity}
              onChange={(e) =>
                setFormDataValue("businessActivity", e.target.value)
              }
              placeholder="Ex: Comércio varejista"
            />
          </div>
          <div>
            <Label htmlFor="monthlyRevenue">Faturamento Mensal</Label>
            <Select
              value={form.monthlyRevenue || undefined}
              onValueChange={(value) =>
                setFormDataValue("monthlyRevenue", value)
              }
            >
              <SelectTrigger id="monthlyRevenue">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label
                  htmlFor="cpf"
                  className="text-xs font-semibold text-foreground/70 uppercase tracking-wider"
                >
                  CPF
                </Label>
                <ValidationBadge valid={cpfValid} />
              </div>
              <Input
                id="cpf"
                className={cn(
                  cpfValid === false
                    ? "border-destructive/50 focus:ring-destructive/30"
                    : cpfValid === true
                      ? "border-primary/50 focus:ring-primary/30"
                      : "",
                )}
                value={form.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setFormDataValue("phone", formatPhone(e.target.value))
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setFormDataValue("dateOfBirth", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
