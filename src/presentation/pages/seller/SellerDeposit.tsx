import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { useUserContext } from "@/presentation/context/UserContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerProfileQuery from "@/presentation/hooks/use-seller-profile-query";
import usePixAmountLimitsQuery from "@/presentation/hooks/use-pix-amount-limits-query";
import { cn } from "@/presentation/utils/cn";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import {
  describePixAmountLimits,
  getPixAmountLimitError,
} from "@/presentation/utils/pix-amount-limits.util";
import { normalizePixChargeResponse } from "@/presentation/utils/normalize-pix-charge-response.util";
import { resolvePixQrCodeSrc } from "@/presentation/utils/resolve-pix-qr-code-src.util";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  QrCode,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const DEPOSIT_EXPIRES_IN_SECONDS = 5 * 60;
const POLL_INTERVAL_MS = 2500;
/** CPF válido usado quando o seller não cadastrou documento. */
const DEFAULT_DEPOSIT_CPF = "52998224725";

type TDepositStep = "form" | "pix" | "success" | "expired";

function formatCurrencyFromCents(cents: string) {
  const value = parseInt(cents || "0", 10);
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCountdown(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function copyWithExecCommand(text: string, input?: HTMLInputElement | null) {
  if (input) {
    const wasReadOnly = input.hasAttribute("readonly");
    input.removeAttribute("readonly");
    input.focus();
    input.select();
    input.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    if (wasReadOnly) input.setAttribute("readonly", "");
    if (ok) return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}

async function copyTextToClipboard(
  text: string,
  input?: HTMLInputElement | null,
) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // iOS/Safari often rejects Clipboard API; fall back below
    }
  }
  return copyWithExecCommand(text, input);
}

function DepositConfirmedAnimation() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-emerald-500/35 animate-deposit-ring" />
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-[0_12px_40px_rgba(16,185,129,0.45)] animate-deposit-confirm-pop">
        <svg viewBox="0 0 52 52" className="h-12 w-12" aria-hidden>
          <path
            d="M14 27 l8 8 16-18"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            className="animate-deposit-check-draw"
          />
        </svg>
      </div>
    </div>
  );
}

export default function SellerDeposit() {
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const user = useUserContext();
  const { data: profile, isLoading: profileLoading } = useSellerProfileQuery();
  const { submission, isLoading: kycLoading } = useSellerKycSubmissionQuery();
  const { data: pixLimits } = usePixAmountLimitsQuery();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<TDepositStep>("form");
  const [pixData, setPixData] = useState<ReturnType<
    typeof normalizePixChargeResponse
  > | null>(null);
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(DEPOSIT_EXPIRES_IN_SECONDS);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pixInputRef = useRef<HTMLInputElement>(null);
  const copiedResetRef = useRef<number>();

  const depositorName = useMemo(() => {
    return (
      profile?.fullName?.trim() ||
      submission?.fullName?.trim() ||
      user.name?.trim() ||
      profile?.displayName?.trim() ||
      ""
    );
  }, [profile, submission, user.name]);

  const depositorCpf = useMemo(() => {
    const registered = digitsOnly(submission?.cpf);
    return registered.length === 11 ? registered : DEFAULT_DEPOSIT_CPF;
  }, [submission?.cpf]);

  const identityReady = !profileLoading && !kycLoading;

  useEffect(() => {
    if (step !== "pix" || expiresAtMs == null) return;

    const tick = () => {
      const remaining = Math.ceil((expiresAtMs - Date.now()) / 1000);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setStep("expired");
      }
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [expiresAtMs, step]);

  useEffect(() => {
    if (step !== "pix" || !pixData) return;

    const transactionId = pixData.transactionId;
    const amountCents = parseInt(amount || "0", 10);

    const poll = async () => {
      try {
        const result =
          await apiService.modules.transaction.listSellerTransactions({
            page: 1,
            limit: 50,
            kind: "all",
          });
        const transactions = result.items;
        const matched = transactionId
          ? transactions.find((tx) => tx.id === transactionId)
          : transactions.find(
              (tx) =>
                tx.metadata?.origin === "seller_deposit" &&
                tx.amount === amountCents,
            );
        if (matched?.isPaid()) {
          setStep("success");
          await queryClient.invalidateQueries({
            queryKey: ["seller-transactions"],
          });
        }
      } catch {
        // ignore transient polling errors
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [amount, apiService, pixData, queryClient, step]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(raw);
  };

  const handleGenerate = async () => {
    const amountCents = parseInt(amount || "0", 10);
    const limitError = getPixAmountLimitError(
      amountCents,
      pixLimits?.pixMinAmount,
      pixLimits?.pixMaxAmount,
    );
    if (limitError) {
      toast.error(limitError);
      return;
    }
    if (!depositorName) {
      toast.error("Não encontramos o nome da sua conta.");
      return;
    }

    setLoading(true);
    setError("");
    setPixData(null);

    try {
      const data = await apiService.modules.pix.createPixCharge({
        amount: amountCents,
        customer_name: depositorName,
        customer_tax_id: depositorCpf,
        comment: "Depósito via portal",
        expires_in: DEPOSIT_EXPIRES_IN_SECONDS,
      });

      const normalized = normalizePixChargeResponse(data);

      if (normalized.error || !normalized.pixCode) {
        const message =
          normalized.error || "Não foi possível gerar o código PIX";
        setError(message);
        toast.error(message);
      } else {
        const expiresAt = normalized.expiresAt
          ? new Date(normalized.expiresAt).getTime()
          : Date.now() + DEPOSIT_EXPIRES_IN_SECONDS * 1000;
        setPixData(normalized);
        setExpiresAtMs(expiresAt);
        setRemainingSeconds(
          Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
        );
        setStep("pix");
        toast.success("PIX gerado com sucesso!");
      }
    } catch (err) {
      const message = getErrorMessageOrDefault(err, "Erro de conexão");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    const ok = await copyTextToClipboard(text, pixInputRef.current);
    if (!ok) {
      toast.error("Não foi possível copiar o código");
      return;
    }

    setCopied(true);
    toast.success("Código copiado!");
    window.clearTimeout(copiedResetRef.current);
    copiedResetRef.current = window.setTimeout(() => setCopied(false), 2500);
  };

  const pixCode = pixData?.pixCode ?? "";
  const qrCodeSrc = resolvePixQrCodeSrc({
    qrCodeImage: pixData?.qrCodeImage,
    pixCode,
  });

  const reset = () => {
    setPixData(null);
    setError("");
    setAmount("");
    setExpiresAtMs(null);
    setRemainingSeconds(DEPOSIT_EXPIRES_IN_SECONDS);
    setCopied(false);
    window.clearTimeout(copiedResetRef.current);
    setStep("form");
  };

  useEffect(() => {
    return () => window.clearTimeout(copiedResetRef.current);
  }, []);

  return (
    <SellerLayout>
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 overflow-x-hidden px-4 py-5 sm:space-y-6 sm:px-5 md:px-8 md:py-9">
        <PageHeader
          className="mb-0"
          eyebrow="Financeiro"
          title="Depósito via PIX"
          description="Gere um QR Code PIX para depositar na sua conta. O código expira em 5 minutos."
        />

        {step === "form" ? (
          <div className="admin-surface space-y-4 p-4 sm:space-y-5 sm:p-5 md:p-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Valor do depósito
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {describePixAmountLimits(
                  pixLimits?.pixMinAmount,
                  pixLimits?.pixMaxAmount,
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={amount ? formatCurrencyFromCents(amount) : ""}
                  onChange={handleAmountChange}
                  className="rounded-xl border-border/60 text-sm font-mono"
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
                disabled={loading || !identityReady}
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
        ) : null}

        {step === "pix" && pixData ? (
          <div className="admin-surface space-y-4 p-4 sm:space-y-5 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 size={16} className="shrink-0 text-primary" />
                  PIX gerado
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código para pagar.
                </p>
              </div>
              {pixData.acquirer && (
                <Badge
                  variant="outline"
                  className="w-fit shrink-0 self-start text-xs"
                >
                  via {pixData.acquirer}
                </Badge>
              )}
            </div>

            <div className="text-center">
              <p className="mb-3 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                {formatCurrencyFromCents(amount)}
              </p>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold tabular-nums",
                  remainingSeconds <= 60
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning",
                )}
              >
                <Clock size={14} />
                Expira em {formatCountdown(remainingSeconds)}
              </div>
            </div>

            {qrCodeSrc && (
              <div className="flex justify-center">
                <div className="w-full max-w-[13.5rem] rounded-xl border border-border/60 bg-white p-3 sm:max-w-[15.5rem] sm:p-4">
                  <img
                    src={qrCodeSrc}
                    alt="QR Code PIX"
                    className="aspect-square h-auto w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {pixCode && (
              <div className="min-w-0 space-y-1.5">
                <Label className="text-xs">Código PIX (copia e cola)</Label>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <Input
                    ref={pixInputRef}
                    readOnly
                    value={pixCode}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-xl border-border/60 text-sm font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={copied ? "default" : "outline"}
                    className={cn(
                      "w-full min-w-[7.5rem] gap-1.5 sm:w-auto sm:shrink-0",
                      copied &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    )}
                    onClick={() => void copyToClipboard(pixCode)}
                    aria-live="polite"
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Aguardando confirmação do pagamento…
            </p>

            <Button
              variant="outline"
              onClick={reset}
              className="w-full text-xs"
            >
              Cancelar e gerar outro
            </Button>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="admin-surface space-y-5 p-6 text-center sm:p-8 md:p-10">
            <DepositConfirmedAnimation />
            <div className="space-y-1.5 animate-fade-in">
              <h2 className="text-xl font-semibold text-foreground">
                Depósito confirmado
              </h2>
              <p className="text-sm text-muted-foreground">
                O PIX foi pago e o valor já entra no seu extrato.
              </p>
              <p className="pt-2 text-2xl font-bold tabular-nums text-foreground">
                {formatCurrencyFromCents(amount)}
              </p>
            </div>
            <Button onClick={reset} className="w-full sm:w-auto">
              Fazer outro depósito
            </Button>
          </div>
        ) : null}

        {step === "expired" ? (
          <div className="admin-surface space-y-5 p-6 text-center sm:p-8 md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Clock className="text-destructive" size={28} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-foreground">
                PIX expirado
              </h2>
              <p className="text-sm text-muted-foreground">
                Este código valia por 5 minutos. Gere um novo depósito para
                continuar.
              </p>
            </div>
            <Button onClick={reset} className="w-full sm:w-auto">
              Gerar novo depósito
            </Button>
          </div>
        ) : null}
      </div>
    </SellerLayout>
  );
}
