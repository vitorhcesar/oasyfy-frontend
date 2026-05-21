import { Landmark } from "lucide-react";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import { formatCnpj } from "./utils/format-cnpj";
import { formatCpf } from "./utils/format-cpf";
import { formatPhone } from "./utils/format-phone";
import { isValidCnpj } from "./utils/is-valid-cnpj";
import { isValidCpf } from "./utils/is-valid-cpf";
import ValidationBadge from "./ValidationBadge";

interface IBankStepProps {
  labelClass: string;
  inputClass: string;
}

export default function BankStep({ labelClass, inputClass }: IBankStepProps) {
  const { form, setBank } = useKycOnboardingStore();

  return (
    <div className="space-y-5 animate-step-slide">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <Landmark size={18} className="text-primary flex-shrink-0" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Informe os dados bancários para recebimento. Certifique-se de que a
          conta está no seu nome ou da sua empresa.
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
              setBank("agency", e.target.value.replace(/\D/g, "").slice(0, 6))
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
              setBank("account", e.target.value.replace(/\D/g, "").slice(0, 12))
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
                        ? form.bank.pixKey.replace(/\D/g, "").length === 11
                          ? isValidCpf(form.bank.pixKey)
                          : null
                        : form.bank.pixKeyType === "cnpj"
                        ? form.bank.pixKey.replace(/\D/g, "").length === 14
                          ? isValidCnpj(form.bank.pixKey)
                          : null
                        : form.bank.pixKeyType === "email"
                        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.bank.pixKey)
                        : form.bank.pixKeyType === "phone"
                        ? form.bank.pixKey.replace(/\D/g, "").length >= 10
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
                else if (form.bank.pixKeyType === "cnpj") v = formatCnpj(v);
                else if (form.bank.pixKeyType === "phone") v = formatPhone(v);
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
  );
}
