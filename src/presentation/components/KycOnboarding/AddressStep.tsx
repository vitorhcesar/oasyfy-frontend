import { useBrazilZipCodeService } from "@/presentation/hooks/use-brazil-zip-code-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { Loader2 } from "lucide-react";
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
import ValidationBadge from "./ValidationBadge";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";
import { formatCep } from "./utils/format-cep";

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

export default function AddressStep() {
  const brazilZipCodeService = useBrazilZipCodeService();

  const { form, setFormDataValue, setFormDataAddress } =
    useKycOnboardingStore();

  const [cepLoading, setCepLoading] = useState(false);
  const [cepValid, setCepValid] = useState<boolean | null>(null);

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepValid(null);
      return;
    }
    setCepLoading(true);

    await tryOrToastError(
      async () => {
        const address =
          await brazilZipCodeService.modules.address.getAddressByZipCode(
            digits,
          );
        setFormDataAddress(address);
        setCepValid(true);
      },
      {
        finallyFn: () => {
          setCepLoading(false);
        },
        errorFn: () => {
          setCepValid(false);
        },
      },
    );
  };

  return (
    <div className="space-y-5 animate-step-slide">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="zipCode">
            CEP{" "}
            {cepLoading ? (
              <Loader2 size={10} className="inline animate-spin ml-1" />
            ) : (
              <ValidationBadge valid={cepValid} />
            )}
          </Label>
          <Input
            id="zipCode"
            value={form.zipCode}
            onChange={(e) => {
              const v = formatCep(e.target.value);
              setFormDataValue("zipCode", v);
              lookupCep(v);
            }}
            placeholder="00000-000"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="street">Rua / Avenida</Label>
          <Input
            id="street"
            value={form.street}
            onChange={(e) => setFormDataValue("street", e.target.value)}
            placeholder="Rua / Avenida"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={form.number}
            onChange={(e) => setFormDataValue("number", e.target.value)}
            placeholder="123"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={form.complement}
            onChange={(e) => setFormDataValue("complement", e.target.value)}
            placeholder="Apto, sala (opcional)"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={form.neighborhood}
            onChange={(e) => setFormDataValue("neighborhood", e.target.value)}
            placeholder="Bairro"
          />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setFormDataValue("city", e.target.value)}
            placeholder="Cidade"
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Select
            value={form.state || undefined}
            onValueChange={(value) => setFormDataValue("state", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
