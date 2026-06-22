import { TwoFactorSettingsPanel } from "@/presentation/components/auth/TwoFactorSettingsPanel";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";

export default function Seller2FA() {
  return (
    <SellerLayout>
      <div className="px-4 md:px-8 py-8 max-w-xl mx-auto">
        <TwoFactorSettingsPanel
          issuer="Oasyfy Seller"
          description="Proteja sua conta com verificação via Google Authenticator"
          disabledDescription="Recomendamos ativar para maior segurança."
          enabledDescription="Sua conta está protegida com autenticação de dois fatores."
        />
      </div>
    </SellerLayout>
  );
}
