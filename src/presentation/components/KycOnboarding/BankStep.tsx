import { Landmark } from "lucide-react";
import { Input } from "../Input";
import { Label } from "../Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import { formatCnpj } from "./utils/format-cnpj";
import { formatCpf } from "./utils/format-cpf";
import { formatPhone } from "./utils/format-phone";
import { isValidCnpj } from "./utils/is-valid-cnpj";
import { isValidCpf } from "./utils/is-valid-cpf";
import ValidationBadge from "./ValidationBadge";

export default function BankStep() {
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
          <Label htmlFor="bankName">Nome do Banco</Label>
          <Input
            id="bankName"
            value={form.bank.bankName}
            onChange={(e) => setBank("bankName", e.target.value)}
            placeholder="Ex: Nubank, Itaú, Bradesco"
          />
        </div>
        <div>
          <Label htmlFor="agency">Agência</Label>
          <Input
            id="agency"
            value={form.bank.agency}
            onChange={(e) =>
              setBank("agency", e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="0001"
          />
        </div>
        <div>
          <Label htmlFor="agencyDigit">Dígito da Agência</Label>
          <Input
            id="agencyDigit"
            value={form.bank.agencyDigit}
            onChange={(e) =>
              setBank(
                "agencyDigit",
                e.target.value.replace(/\D/g, "").slice(0, 2),
              )
            }
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="account">Conta</Label>
          <Input
            id="account"
            value={form.bank.account}
            onChange={(e) =>
              setBank("account", e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            placeholder="12345"
          />
        </div>
        <div>
          <Label htmlFor="accountDigit">Dígito da Conta</Label>
          <Input
            id="accountDigit"
            value={form.bank.accountDigit}
            onChange={(e) =>
              setBank(
                "accountDigit",
                e.target.value.replace(/\D/g, "").slice(0, 2),
              )
            }
            placeholder="0"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="accountType">Tipo de Conta</Label>
          <Select
            value={form.bank.accountType || undefined}
            onValueChange={(value) => setBank("accountType", value)}
          >
            <SelectTrigger id="accountType">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corrente">Conta Corrente</SelectItem>
              <SelectItem value="poupanca">Conta Poupança</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-border pt-5 space-y-4">
        <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
          Chave PIX
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pixKeyType">Tipo da Chave</Label>
            <Select
              value={form.bank.pixKeyType || undefined}
              onValueChange={(value) => {
                setBank("pixKeyType", value);
                setBank("pixKey", "");
              }}
            >
              <SelectTrigger id="pixKeyType">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="random">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between pb-[1px]">
              <Label className="pb-0" htmlFor="pixKey">
                Chave PIX
              </Label>

              {form.bank.pixKey.trim() &&
                ["cpf", "cnpj", "email", "phone"].includes(
                  form.bank.pixKeyType,
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
                            ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                form.bank.pixKey,
                              )
                            : form.bank.pixKeyType === "phone"
                              ? form.bank.pixKey.replace(/\D/g, "").length >= 10
                              : null
                    }
                  />
                )}
            </div>

            <Input
              id="pixKey"
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
