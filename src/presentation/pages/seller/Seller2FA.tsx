import { TwoFactorSettingsPanel } from "@/presentation/components/auth/TwoFactorSettingsPanel";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";

export default function Seller2FA() {
  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-xl px-5 py-6 md:px-8 md:py-9">
        <TwoFactorSettingsPanel
          issuer="OmegaPay Seller"
          description="Proteja sua conta com verificação via Google Authenticator"
          disabledDescription="Recomendamos ativar para maior segurança."
          enabledDescription="Sua conta está protegida com autenticação de dois fatores."
        />
      </div>
    </SellerLayout>
  );
}
