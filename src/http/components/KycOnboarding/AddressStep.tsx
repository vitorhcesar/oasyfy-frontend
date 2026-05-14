import { Loader2 } from "lucide-react";
import { useState } from "react";
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

interface IAddressStepProps {
  labelClass: string;
  inputClass: string;
}

export default function AddressStep({
  labelClass,
  inputClass,
}: IAddressStepProps) {
  const { form, setFormDataValue, setFormData } = useKycOnboardingStore();

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
        setFormData({
          ...form,
          street: data.logradouro || form.street,
          neighborhood: data.bairro || form.neighborhood,
          city: data.localidade || form.city,
          state: data.uf || form.state,
        });
        setCepValid(true);
      } else {
        setCepValid(false);
      }
    } catch {
      setCepValid(false);
    } finally {
      setCepLoading(false);
    }
  };

  return (
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
              setFormDataValue("zipCode", v);
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
            onChange={(e) => setFormDataValue("street", e.target.value)}
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
            onChange={(e) => setFormDataValue("number", e.target.value)}
            placeholder="123"
          />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Complemento</label>
          <input
            className={inputClass}
            value={form.complement}
            onChange={(e) => setFormDataValue("complement", e.target.value)}
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
            onChange={(e) => setFormDataValue("neighborhood", e.target.value)}
            placeholder="Bairro"
          />
        </div>
        <div>
          <label className={labelClass}>Cidade</label>
          <input
            className={inputClass}
            value={form.city}
            onChange={(e) => setFormDataValue("city", e.target.value)}
            placeholder="Cidade"
          />
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <select
            className={inputClass}
            value={form.state}
            onChange={(e) => setFormDataValue("state", e.target.value)}
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
  );
}
