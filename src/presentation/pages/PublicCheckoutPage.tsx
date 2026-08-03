import type {
  IPublicCheckoutDto,
  IPublicCheckoutPayResult,
} from "@/infra/http/services/api/modules/checkout.module";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { formatCheckoutAmount } from "@/presentation/pages/seller/checkout-shared";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";

type TStep = "form" | "pix" | "success" | "unavailable";

export default function PublicCheckoutPage() {
  const { publicId = "" } = useParams();
  const apiService = useApiService();

  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<IPublicCheckoutDto | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<TStep>("form");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState<IPublicCheckoutPayResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiService.modules.publicCheckouts.get(publicId);
        if (cancelled) return;
        setCheckout(data);
        setStep(data.available ? "form" : "unavailable");
      } catch (err) {
        if (cancelled) return;
        setError(
          getErrorMessageOrDefault(err, "Checkout não encontrado"),
        );
        setStep("unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (publicId) load();
    return () => {
      cancelled = true;
    };
  }, [apiService, publicId]);

  useEffect(() => {
    if (!payment || step !== "pix" || !publicId) return;

    const timer = window.setInterval(async () => {
      try {
        const status = await apiService.modules.publicCheckouts.getPaymentStatus(
          publicId,
          payment.transactionId,
        );
        if (status.status === "paid" || status.status === "completed") {
          setStep("success");
          window.clearInterval(timer);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [apiService, payment, publicId, step]);

  const qrUrl = useMemo(() => {
    if (!payment?.pixCode) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      payment.pixCode,
    )}`;
  }, [payment?.pixCode]);

  const handlePay = async () => {
    if (!checkout || !customerName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    if (checkout.customerDocumentRequired && customerDocument.replace(/\D/g, "").length !== 11) {
      toast.error("Informe um CPF válido");
      return;
    }

    setPaying(true);
    try {
      const result = await apiService.modules.publicCheckouts.pay(publicId, {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        customer_document: customerDocument.trim() || null,
      });
      setPayment(result);
      setStep("pix");
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Falha ao gerar PIX"));
    } finally {
      setPaying(false);
    }
  };

  const copyPix = async () => {
    if (!payment?.pixCode) return;
    try {
      await navigator.clipboard.writeText(payment.pixCode);
      setCopied(true);
      toast.success("Código PIX copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
      </div>
    );
  }

  const primary = checkout?.branding.primaryColor ?? "#16A34A";
  const background = checkout?.branding.backgroundColor ?? "#FAFAFA";

  return (
    <div className="min-h-screen" style={{ backgroundColor: background }}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-zinc-200/70 backdrop-blur">
          {checkout?.branding.logoUrl ? (
            <img
              src={checkout.branding.logoUrl}
              alt=""
              className="mx-auto h-14 w-auto object-contain"
            />
          ) : (
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              {(checkout?.title || "C").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {checkout?.title || "Checkout"}
            </h1>
            {checkout?.description ? (
              <p className="text-sm text-zinc-600">{checkout.description}</p>
            ) : null}
          </div>

          {checkout ? (
            <p
              className="text-center text-3xl font-semibold tracking-tight"
              style={{ color: primary }}
            >
              {formatCheckoutAmount(checkout.amount)}
            </p>
          ) : null}

          {step === "unavailable" ? (
            <div className="space-y-2 py-4 text-center">
              <p className="font-medium text-zinc-900">Checkout indisponível</p>
              <p className="text-sm text-zinc-600">
                {error ||
                  "Este link está pausado, expirado ou não aceita mais pagamentos."}
              </p>
            </div>
          ) : null}

          {step === "form" && checkout ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nome</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerEmail">E-mail</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              {checkout.customerDocumentRequired ? (
                <div className="space-y-1.5">
                  <Label htmlFor="customerDocument">CPF</Label>
                  <Input
                    id="customerDocument"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              ) : null}
              <Button
                className="w-full text-white"
                style={{ backgroundColor: primary }}
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {checkout.branding.buttonText}
              </Button>
            </div>
          ) : null}

          {step === "pix" && payment ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-zinc-600">
                Escaneie o QR Code ou copie o código PIX para pagar.
              </p>
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Code PIX"
                  className="mx-auto h-[220px] w-[220px] rounded-xl bg-white p-2"
                />
              ) : null}
              <Button
                variant="outline"
                className="w-full"
                onClick={copyPix}
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copiado!" : "Copiar código PIX"}
              </Button>
              <p className="text-xs text-zinc-500">
                Aguardando confirmação do pagamento…
              </p>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="space-y-3 py-4 text-center">
              <CheckCircle2
                className="mx-auto h-12 w-12"
                style={{ color: primary }}
              />
              <p className="text-lg font-semibold text-zinc-900">
                {payment?.successMessage ||
                  checkout?.successMessage ||
                  "Pagamento confirmado. Obrigado!"}
              </p>
            </div>
          ) : null}

          <p className="pt-2 text-center text-[11px] text-zinc-500">
            Pagamento processado por Omegapay
          </p>
        </div>
      </div>
    </div>
  );
}
