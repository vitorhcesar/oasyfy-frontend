import { SellerLayout } from "@/http/components/seller/SellerLayout";
import { UnderConstruction } from "@/http/components/UnderConstruction";
import { useKycStatus } from "@/http/hooks/use-kyc-status";
import { AlertTriangle } from "lucide-react";

export default function SellerApps() {
  const { kycApproved, loading } = useKycStatus();

  if (kycApproved === false && !loading) {
    return (
      <SellerLayout>
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            KYC pendente
          </h2>
          <p className="text-sm text-muted-foreground">
            Você precisa ter seu KYC aprovado para acessar a Central de Apps.
            Complete ou aguarde a aprovação dos seus documentos.
          </p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <UnderConstruction
        title="Central de Apps"
        description="A central de integrações e apps estará disponível em breve."
      />
    </SellerLayout>
  );
}
