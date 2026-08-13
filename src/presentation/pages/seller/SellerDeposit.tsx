import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { normalizePixChargeResponse } from "@/presentation/utils/normalize-pix-charge-response.util";
import { AlertCircle, CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SellerDeposit() {
  const apiService = useApiService();
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<ReturnType<
    typeof normalizePixChargeResponse
  > | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const formatCurrency = (value: string) => {
    const nums = value.replace(/\D/g, "");
    const cents = parseInt(nums || "0");
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(raw);
  };

  const handleGenerate = async () => {
    const amountCents = parseInt(amount || "0");
    if (amountCents < 100) {
      toast.error("Valor mínimo: R$ 1,00");
      return;
    }
    if (!name.trim()) {
      toast.error("Nome do depositante é obrigatório");
      return;
    }

    setLoading(true);
    setError("");
    setPixData(null);

    try {
      const data = await apiService.modules.pix.createPixCharge({
        amount: amountCents,
        customer_name: name.trim(),
        ...(document.replace(/\D/g, "")
          ? { customer_tax_id: document.replace(/\D/g, "") }
          : {}),
        comment: document.trim()
          ? `Doc: ${document.replace(/\D/g, "")}`
          : "Depósito via portal",
      });

      const normalized = normalizePixChargeResponse(data);

      if (normalized.error || !normalized.pixCode) {
        const message =
          normalized.error || "Não foi possível gerar o código PIX";
        setError(message);
        toast.error(message);
      } else {
        setPixData(normalized);
        toast.success("PIX gerado com sucesso!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro de conexão";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const pixCode = pixData?.pixCode ?? "";
  const qrCodeImage = pixData?.qrCodeImage ?? "";

  const reset = () => {
    setPixData(null);
    setError("");
    setAmount("");
    setName("");
    setDocument("");
  };

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title="Depósito via PIX"
          description="Gere um QR Code PIX para depositar na sua conta (roteamento Woovi/Cartwave)."
        />

        {!pixData ? (
          <div className="admin-surface space-y-5 p-5 md:p-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Dados do depósito
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Preencha os dados para gerar o PIX.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor do depósito</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={amount ? formatCurrency(amount) : ""}
                  onChange={handleAmountChange}
                  className="rounded-xl border-border/60 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nome do depositante</Label>
                <Input
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-border/60 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">CPF/CNPJ do depositante</Label>
                  <span className="text-xs italic text-muted-foreground/60">
                    Opcional
                  </span>
                </div>
                <Input
                  placeholder="000.000.000-00"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="rounded-xl border-border/60 text-sm font-mono"
                  maxLength={18}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full gap-2 !mt-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <QrCode size={16} />
                )}
                {loading ? "Gerando PIX..." : "Gerar PIX"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="admin-surface space-y-5 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 size={16} className="text-primary" />
                  PIX gerado com sucesso
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código para pagar.
                </p>
              </div>
              {pixData.acquirer && (
                <Badge variant="outline" className="text-xs">
                  via {pixData.acquirer}
                </Badge>
              )}
            </div>

            <div className="text-center">
              <p className="mb-1 text-3xl font-bold tabular-nums text-foreground">
                {formatCurrency(amount)}
              </p>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>

            {qrCodeImage && (
              <div className="flex justify-center">
                <div className="rounded-xl border border-border/60 bg-white p-4">
                  <img
                    src={
                      qrCodeImage.startsWith("data:")
                        ? qrCodeImage
                        : qrCodeImage.startsWith("http")
                          ? qrCodeImage
                          : `data:image/png;base64,${qrCodeImage}`
                    }
                    alt="QR Code PIX"
                    className="h-48 w-48"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {pixCode && (
              <div className="space-y-1.5">
                <Label className="text-xs">Código PIX (copia e cola)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={pixCode}
                    className="flex-1 rounded-xl border-border/60 text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "gap-1.5 shrink-0",
                      copied && "text-primary border-primary/30",
                    )}
                    onClick={() => copyToClipboard(pixCode)}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
            )}

            {(pixData.failoverAttempts ?? 0) > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Failover: {pixData.failoverAttempts} tentativa(s) antes do
                sucesso
              </p>
            )}

            <Button
              variant="outline"
              onClick={reset}
              className="w-full text-xs"
            >
              Gerar novo depósito
            </Button>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
