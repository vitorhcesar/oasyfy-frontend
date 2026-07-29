import { CheckCircle2, Pencil } from "lucide-react";
import { COMPANY_TYPE_OPTIONS } from "./constants/company-type-options";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";

export default function ReviewStep() {
  const { form, files, isPj, setStep } = useKycOnboardingStore();

  return (
    <div className="space-y-4 animate-step-slide">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10 mb-2">
        <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Revise os documentos com atenção. Após o envio, a análise libera as
          vendas. Endereço e dados bancários serão pedidos depois para saques.
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
          {isPj() ? "Pessoa Jurídica" : "Pessoa Física"}
        </p>
      </div>

      <div
        onClick={() => setStep("personal")}
        className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">
            Identificação
          </h4>
          <Pencil
            size={12}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {isPj() ? (
            <>
              <div>
                <span className="text-muted-foreground text-xs">CNPJ</span>
                <p className="font-medium text-foreground">{form.cnpj}</p>
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
                    (o) => o.value === form.companyType,
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
            </>
          ) : (
            <div>
              <span className="text-muted-foreground text-xs">CPF</span>
              <p className="font-medium text-foreground">{form.cpf}</p>
            </div>
          )}
        </div>
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
    </div>
  );
}
