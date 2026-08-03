import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerCheckoutsQuery from "@/presentation/hooks/use-seller-checkouts-query";
import useSellerCheckoutServiceStatusQuery from "@/presentation/hooks/use-seller-checkout-service-status-query";
import {
  CHECKOUT_STATUS_LABEL,
  formatCheckoutAmount,
} from "@/presentation/pages/seller/checkout-shared";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "paused" || status === "expired") return "secondary";
  if (status === "archived") return "outline";
  return "destructive";
}

export default function SellerCheckouts() {
  const { canSell, isLoading: kycLoading } = useSellerKycSubmissionQuery();
  const { checkouts, isLoading } = useSellerCheckoutsQuery();
  const { status: serviceStatus } = useSellerCheckoutServiceStatusQuery();

  if (!kycLoading && canSell === false) {
    return (
      <SellerLayout>
        <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center md:px-8">
          <h2 className="text-xl font-semibold">KYC pendente</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete ou aguarde a aprovação dos documentos para criar checkouts.
          </p>
          <Button asChild className="mt-6">
            <Link to="/seller/kyc">Ir para documentos</Link>
          </Button>
        </div>
      </SellerLayout>
    );
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const createDisabled = serviceStatus?.isEnabled === false;
  const showStatusBanner = serviceStatus?.showStatus === true;
  const health = serviceStatus?.healthStatus ?? "unknown";
  const isOnline = serviceStatus?.isEnabled === true && health === "up";
  const isOffline =
    serviceStatus?.isEnabled === false || health === "down";

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title="Checkouts"
          description="Crie links de pagamento personalizados para enviar aos seus clientes."
          actions={
            createDisabled ? (
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Novo checkout
              </Button>
            ) : (
              <Button asChild>
                <Link to="/seller/checkouts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo checkout
                </Link>
              </Button>
            )
          }
        />

        {createDisabled ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">
                Checkout temporariamente desligado pela plataforma
              </p>
              <p className="mt-1 text-muted-foreground">
                Não é possível criar novos links no momento.
              </p>
            </div>
          </div>
        ) : null}

        {showStatusBanner && !createDisabled ? (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              isOnline
                ? "border-emerald-500/30 bg-emerald-500/10"
                : isOffline
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-amber-500/30 bg-amber-500/10"
            }`}
          >
            {isOnline ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="font-medium text-foreground">
                {isOnline
                  ? "Checkout online"
                  : isOffline
                    ? "Checkout temporariamente indisponível"
                    : "Status do checkout ainda não verificado"}
              </p>
              {serviceStatus?.healthMessage && isOffline ? (
                <p className="mt-1 text-muted-foreground">
                  {serviceStatus.healthMessage}
                </p>
              ) : null}
              {serviceStatus?.publicBaseUrl ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Domínio: {serviceStatus.publicBaseUrl}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isLoading || kycLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : checkouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 px-6 py-16 text-center">
            <Link2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum checkout ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie um link com a sua marca e compartilhe com o cliente.
            </p>
            {createDisabled ? (
              <Button className="mt-6" disabled>
                Criar primeiro checkout
              </Button>
            ) : (
              <Button asChild className="mt-6">
                <Link to="/seller/checkouts/new">Criar primeiro checkout</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
            {checkouts.map((checkout) => (
              <div
                key={checkout.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/seller/checkouts/${checkout.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {checkout.title}
                    </Link>
                    <Badge variant={statusVariant(checkout.effectiveStatus)}>
                      {CHECKOUT_STATUS_LABEL[checkout.effectiveStatus] ??
                        checkout.effectiveStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCheckoutAmount(checkout.amount)} ·{" "}
                    {checkout.paidCount} pagos ·{" "}
                    {formatCheckoutAmount(checkout.totalReceived)} recebidos
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(checkout.url)}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copiar link
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/seller/checkouts/${checkout.id}`}>Abrir</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
