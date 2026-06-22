import { TwoFactorSettingsPanel } from "@/presentation/components/auth/TwoFactorSettingsPanel";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";

export default function Admin2FA() {
  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-8 max-w-xl mx-auto">
        <TwoFactorSettingsPanel
          issuer="Oasyfy Admin"
          description="Proteja sua conta admin com verificação via Google Authenticator"
          disabledDescription="Como administrador, é altamente recomendado ativar o 2FA."
          enabledDescription="Sua conta está protegida com autenticação de dois fatores."
        />
      </div>
    </AdminLayout>
  );
}
