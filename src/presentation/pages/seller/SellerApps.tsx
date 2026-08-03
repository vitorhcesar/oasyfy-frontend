import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useKycStatus } from "@/presentation/hooks/use-kyc-status";
import useSellerProfileQuery from "@/presentation/hooks/use-seller-profile-query";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import { buildApiAccessSupportUrl } from "@/presentation/utils/build-api-access-support-url";
import {
  AlertTriangle,
  BookOpen,
  Code2,
  ExternalLink,
  KeyRound,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function SellerApps() {
  const { user } = useAuthContext();
  const { kycApproved, loading: kycLoading } = useKycStatus();
  const { apiAccessEnabled, isLoading: kycQueryLoading } =
    useSellerKycSubmissionQuery();
  const { data: profile } = useSellerProfileQuery();

  const loading = kycLoading || kycQueryLoading;

  if (kycApproved === false && !loading) {
    return (
      <SellerLayout>
        <div className="mx-auto max-w-lg py-20 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle size={24} className="text-destructive" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-foreground">
            KYC pendente
          </h2>
          <p className="text-sm text-muted-foreground">
            Você precisa ter seu KYC aprovado para acessar a Central de
            Integração. Complete ou aguarde a aprovação dos seus documentos.
          </p>
        </div>
      </SellerLayout>
    );
  }

  const openSupport = () => {
    const url = buildApiAccessSupportUrl({
      accountId: profile?.accountId,
      email: profile?.email ?? user?.email,
    });
    if (!url) {
      toast.error(
        "Canal de suporte não configurado. Contate a administração Omegapay.",
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Developer"
          title="Integração"
          description="API Omegapay e documentação para conectar sua operação"
        />

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : apiAccessEnabled ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/seller/api"
              className="group rounded-2xl border border-border/60 bg-muted/20 p-5 transition-colors hover:bg-muted/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Code2 size={20} />
              </div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Chaves API
              </h3>
              <p className="text-sm text-muted-foreground">
                Gerencie chaves de acesso e IPs autorizados para o gateway.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Abrir
                <KeyRound size={14} className="opacity-70" />
              </span>
            </Link>

            <Link
              to="/seller/api-docs"
              className="group rounded-2xl border border-border/60 bg-muted/20 p-5 transition-colors hover:bg-muted/40"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen size={20} />
              </div>
              <h3 className="mb-1 text-base font-semibold text-foreground">
                Documentação
              </h3>
              <p className="text-sm text-muted-foreground">
                Endpoints, autenticação, permissões e exemplos de integração.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Abrir docs
                <ExternalLink size={14} className="opacity-70" />
              </span>
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-lg py-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound size={24} className="text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-foreground">
              API disponível sob liberação
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              A API Omegapay é privada. Após análise da administração, sua conta
              poderá criar chaves e consumir o gateway. Fale com o suporte para
              solicitar a liberação.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={openSupport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle size={16} />
                Falar com o suporte
              </button>
              <Link
                to="/seller/api-docs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
              >
                <BookOpen size={16} />
                Ver documentação
              </Link>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
