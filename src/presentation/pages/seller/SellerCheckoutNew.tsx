import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Button } from "@/presentation/components/ui/button";
import { Checkbox } from "@/presentation/components/ui/checkbox";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerCheckoutsQuery from "@/presentation/hooks/use-seller-checkouts-query";
import usePixAmountLimitsQuery from "@/presentation/hooks/use-pix-amount-limits-query";
import {
  CheckoutPreview,
  formatCheckoutAmount,
} from "@/presentation/pages/seller/checkout-shared";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import {
  describePixAmountLimits,
  getPixAmountLimitError,
} from "@/presentation/utils/pix-amount-limits.util";

export default function SellerCheckoutNew() {
  const navigate = useNavigate();
  const apiService = useApiService();
  const { canSell, isLoading: kycLoading } = useSellerKycSubmissionQuery();
  const { createMutation } = useSellerCheckoutsQuery();
  const { data: pixLimits } = usePixAmountLimitsQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("10000");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#22C55E");
  const [backgroundColor, setBackgroundColor] = useState("#FAFAFA");
  const [buttonText, setButtonText] = useState("Pagar com PIX");
  const [successMessage, setSuccessMessage] = useState(
    "Pagamento confirmado. Obrigado!",
  );
  const [customerDocumentRequired, setCustomerDocumentRequired] =
    useState(false);
  const [maxPayments, setMaxPayments] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const amountCents = parseInt(amount.replace(/\D/g, "") || "0", 10);

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

  const handleSubmit = async () => {
    if (title.trim().length < 3) {
      toast.error("Título deve ter pelo menos 3 caracteres");
      return;
    }
    const limitError = getPixAmountLimitError(
      amountCents,
      pixLimits?.pixMinAmount,
      pixLimits?.pixMaxAmount,
    );
    if (limitError) {
      toast.error(limitError);
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        amount: amountCents,
        logoUrl,
        primaryColor,
        backgroundColor,
        buttonText: buttonText.trim() || "Pagar com PIX",
        successMessage: successMessage.trim() || null,
        customerDocumentRequired,
        maxPayments: maxPayments ? Number(maxPayments) : null,
      });
      toast.success("Checkout criado");
      navigate(`/seller/checkouts/${created.id}`);
    } catch (err) {
      toast.error(getErrorMessageOrDefault(err, "Falha ao criar"));
    }
  };

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title="Novo checkout"
          description="Defina valor, aparência e compartilhe o link com o cliente."
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mentoria 1:1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sessão de 60 minutos"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                value={formatCheckoutAmount(amountCents)}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/\D/g, ""))
                }
              />
              <p className="text-xs text-muted-foreground">
                {describePixAmountLimits(
                  pixLimits?.pixMinAmount,
                  pixLimits?.pixMaxAmount,
                )}
              </p>
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
              <Label htmlFor="maxPayments">Máx. pagamentos (opcional)</Label>
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
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || uploadingLogo}
              >
                {(createMutation.isPending || uploadingLogo) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar checkout
              </Button>
              <Button asChild variant="outline">
                <Link to="/seller/checkouts">Cancelar</Link>
              </Button>
            </div>
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
      </div>
    </SellerLayout>
  );
}
