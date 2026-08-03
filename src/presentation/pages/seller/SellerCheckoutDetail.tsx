import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Checkbox } from "@/presentation/components/ui/checkbox";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useSellerCheckoutDetailQuery } from "@/presentation/hooks/use-seller-checkouts-query";
import {
  CHECKOUT_STATUS_LABEL,
  CheckoutPreview,
  formatCheckoutAmount,
} from "@/presentation/pages/seller/checkout-shared";
import { Copy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";

export default function SellerCheckoutDetail() {
  const { id } = useParams();
  const checkoutId = id ? Number(id) : null;
  const apiService = useApiService();
  const { checkout, isLoading, payments, paymentsLoading, updateMutation } =
    useSellerCheckoutDetailQuery(
      checkoutId && Number.isFinite(checkoutId) ? checkoutId : null,
    );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#16A34A");
  const [backgroundColor, setBackgroundColor] = useState("#FAFAFA");
  const [buttonText, setButtonText] = useState("Pagar com PIX");
  const [successMessage, setSuccessMessage] = useState("");
  const [customerDocumentRequired, setCustomerDocumentRequired] =
    useState(false);
  const [maxPayments, setMaxPayments] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!checkout) return;
    setTitle(checkout.title);
    setDescription(checkout.description ?? "");
    setAmount(String(checkout.amount));
    setLogoUrl(checkout.logoUrl);
    setPrimaryColor(checkout.primaryColor);
    setBackgroundColor(checkout.backgroundColor);
    setButtonText(checkout.buttonText);
    setSuccessMessage(checkout.successMessage ?? "");
    setCustomerDocumentRequired(checkout.customerDocumentRequired);
    setMaxPayments(
      checkout.maxPayments != null ? String(checkout.maxPayments) : "",
    );
  }, [checkout]);

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="flex justify-center px-5 py-20 md:px-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </SellerLayout>
    );
  }

  if (!checkout) {
    return (
      <SellerLayout>
        <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center md:px-8">
          <h2 className="text-xl font-semibold">Checkout não encontrado</h2>
          <Button asChild className="mt-6">
            <Link to="/seller/checkouts">Voltar</Link>
          </Button>
        </div>
      </SellerLayout>
    );
  }

  const amountCents = parseInt(amount.replace(/\D/g, "") || "0", 10);
  const canEditAmount = checkout.paidCount === 0;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(checkout.url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await apiService.modules.sellerCheckouts.uploadLogo(file);
      setLogoUrl(result.logoUrl);
      toast.success("Logo enviado");
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Falha no upload"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        ...(canEditAmount ? { amount: amountCents } : {}),
        logoUrl,
        primaryColor,
        backgroundColor,
        buttonText: buttonText.trim() || "Pagar com PIX",
        successMessage: successMessage.trim() || null,
        customerDocumentRequired,
        maxPayments: maxPayments ? Number(maxPayments) : null,
      });
      toast.success("Checkout atualizado");
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Falha ao salvar"));
    }
  };

  const setStatus = async (status: "active" | "paused" | "archived") => {
    try {
      await updateMutation.mutateAsync({ status });
      toast.success("Status atualizado");
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Falha ao atualizar"));
    }
  };

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title={checkout.title}
          description={
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {CHECKOUT_STATUS_LABEL[checkout.effectiveStatus] ??
                  checkout.effectiveStatus}
              </Badge>
              <span>
                {checkout.paidCount} pagos ·{" "}
                {formatCheckoutAmount(checkout.totalReceived)} recebidos
              </span>
            </span>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>
              {checkout.status === "active" ? (
                <Button
                  variant="secondary"
                  onClick={() => setStatus("paused")}
                  disabled={updateMutation.isPending}
                >
                  Pausar
                </Button>
              ) : null}
              {checkout.status === "paused" ? (
                <Button
                  variant="secondary"
                  onClick={() => setStatus("active")}
                  disabled={updateMutation.isPending}
                >
                  Reativar
                </Button>
              ) : null}
              {checkout.status !== "archived" ? (
                <Button
                  variant="outline"
                  onClick={() => setStatus("archived")}
                  disabled={updateMutation.isPending}
                >
                  Arquivar
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Link público: </span>
          <a
            href={checkout.url}
            target="_blank"
            rel="noreferrer"
            className="break-all font-medium text-primary hover:underline"
          >
            {checkout.url}
          </a>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                value={formatCheckoutAmount(amountCents)}
                disabled={!canEditAmount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/\D/g, ""))
                }
              />
              {!canEditAmount ? (
                <p className="text-xs text-muted-foreground">
                  Valor bloqueado após o primeiro pagamento confirmado.
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor primária</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Fundo</Label>
                <Input
                  id="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto do botão</Label>
              <Input
                id="buttonText"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="successMessage">Mensagem de sucesso</Label>
              <Input
                id="successMessage"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPayments">Máx. pagamentos</Label>
              <Input
                id="maxPayments"
                type="number"
                min={1}
                value={maxPayments}
                onChange={(e) => setMaxPayments(e.target.value)}
                placeholder="Ilimitado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingLogo}
                onChange={(e) =>
                  handleLogoUpload(e.target.files?.[0] ?? null)
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={customerDocumentRequired}
                onCheckedChange={(v) =>
                  setCustomerDocumentRequired(v === true)
                }
              />
              Exigir CPF do comprador
            </label>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || uploadingLogo}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar alterações
            </Button>
          </div>

          <CheckoutPreview
            title={title}
            description={description}
            amountCents={amountCents}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
            backgroundColor={backgroundColor}
            buttonText={buttonText}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Pagamentos</h2>
          {paymentsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pagamento gerado ainda.
            </p>
          ) : (
            <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
              {payments.map((payment) => (
                <div
                  key={payment.transactionId}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{payment.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.customerEmail || "Sem e-mail"} · #
                      {payment.transactionId}
                    </p>
                  </div>
                  <div className="text-sm">
                    {formatCheckoutAmount(payment.amount)} · {payment.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
