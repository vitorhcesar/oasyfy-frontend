import { supabase } from "@/infrastructure/integrations/supabase/client";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { cn } from "@/presentation/utils/cn";
import { AlertCircle, CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SellerDeposit() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
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
      const { data, error: fnError } = await supabase.functions.invoke(
        "cartwave-pix",
        {
          body: {
            action: "create-pix",
            amount: amountCents,
            debtor_name: name.trim(),
            ...(document.trim()
              ? {
                  debtor_document: document.replace(/\D/g, ""),
                  type_document:
                    document.replace(/\D/g, "").length > 11 ? "CNPJ" : "CPF",
                }
              : {}),
          },
        }
      );

      if (fnError) {
        setError(fnError.message || "Erro ao gerar PIX");
        toast.error("Erro ao gerar PIX");
      } else if (data?.error) {
        setError(data.error);
        toast.error(data.error);
      } else {
        setPixData(data);
        toast.success("PIX gerado com sucesso!");
      }
    } catch (err) {
      setError("Erro de conexão");
      toast.error("Erro de conexão");
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

  const pixCode =
    pixData?.pix_copy_paste || pixData?.qr_code?.emv || pixData?.emv || "";
  const qrCodeImage = pixData?.qr_code?.base64 || pixData?.base_64_image || "";

  const reset = () => {
    setPixData(null);
    setError("");
    setAmount("");
    setName("");
    setDocument("");
  };

  return (
    <SellerLayout>
      <div className="w-full max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Depósito via PIX
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gere um QR Code PIX para depositar na sua conta.
          </p>
        </div>

        {!pixData ? (
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Dados do depósito</CardTitle>
              <CardDescription className="text-xs">
                Preencha os dados para gerar o PIX.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor do depósito</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={amount ? formatCurrency(amount) : ""}
                  onChange={handleAmountChange}
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nome do depositante</Label>
                <Input
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">CPF/CNPJ do depositante</Label>
                  <span className="text-[10px] text-muted-foreground/60 italic">
                    Opcional
                  </span>
                </div>
                <Input
                  placeholder="000.000.000-00"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="text-sm font-mono"
                  maxLength={18}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <QrCode size={16} />
                )}
                {loading ? "Gerando PIX..." : "Gerar PIX"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    PIX gerado com sucesso
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Escaneie o QR Code ou copie o código para pagar.
                  </CardDescription>
                </div>
                {pixData?._routing && (
                  <Badge variant="outline" className="text-[10px]">
                    via {pixData._routing.acquirer}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(amount)}
                </p>
                <p className="text-xs text-muted-foreground">{name}</p>
              </div>

              {qrCodeImage && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl border border-border/30">
                    <img
                      src={
                        qrCodeImage.startsWith("data:")
                          ? qrCodeImage
                          : `data:image/png;base64,${qrCodeImage}`
                      }
                      alt="QR Code PIX"
                      className="w-48 h-48"
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
                      className="text-[11px] font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "gap-1.5 shrink-0",
                        copied && "text-primary border-primary/30"
                      )}
                      onClick={() => copyToClipboard(pixCode)}
                    >
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
              )}

              {pixData?._routing?.failover_attempts > 0 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Failover: {pixData._routing.failover_attempts} tentativa(s)
                  antes do sucesso
                </p>
              )}

              <Button
                variant="outline"
                onClick={reset}
                className="w-full text-xs"
              >
                Gerar novo depósito
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SellerLayout>
  );
}
