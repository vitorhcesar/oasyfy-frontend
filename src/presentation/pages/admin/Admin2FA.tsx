import { TwoFactorSettingsPanel } from "@/presentation/components/auth/TwoFactorSettingsPanel";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";

export default function Admin2FA() {
  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-xl px-5 py-6 md:px-8 md:py-9">
        <TwoFactorSettingsPanel
          issuer="OmegaPay Admin"
          description="Proteja sua conta admin com verificação via Google Authenticator"
          disabledDescription="Como administrador, é altamente recomendado ativar o 2FA."
          enabledDescription="Sua conta está protegida com autenticação de dois fatores."
        />
      </div>
    </AdminLayout>
  );
}
