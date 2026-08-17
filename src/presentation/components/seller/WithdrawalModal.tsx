import { useApiService } from "@/presentation/hooks/use-api-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { cn } from "@/presentation/utils/cn";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Info,
  Loader2,
  Lock,
  QrCode,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  resolveWithdrawalModalBalance,
  type TWithdrawalBalanceTab,
} from "./resolve-withdrawal-modal-balance.util";

/** Cartão permanece no backend; a aba fica oculta até a integração.
 *  Enquanto a aba estiver oculta, o modal usa o saldo total disponível. */
const SHOW_CARD_BALANCE_TAB = false;

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();

    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + diff * eased);
      setValue(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prev.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function AnimatedBalance({ cents }: { cents: number }) {
  const animated = useCountUp(cents);
  const display = `R$ ${(animated / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
  return (
    <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
      {display}
    </p>
  );
}

interface IBankData {
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  account?: string;
  accountDigit?: string;
  accountType?: string;
  pixKey?: string;
  pixKeyType?: string;
}

interface IWithdrawalFeeConfig {
  fixed: number;
  variable: number;
  min: number;
}

interface IWithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  cardBalance: number;
  pixBoletoBalance: number;
  onSuccess: () => void;
}

type TStep = "amount" | "confirm" | "success";
type TBalanceTab = TWithdrawalBalanceTab;

interface IWithdrawalLimits {
  min: number; // cents
  max: number; // cents (0 = no limit)
  dailyMax: number; // cents (0 = no limit)
}

const DEFAULT_MIN = 200; // R$ 2,00
const DEFAULT_FEE: IWithdrawalFeeConfig = { fixed: 0, variable: 0, min: 0 };

const PIX_TYPE_LABEL: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Celular",
};

const fmt = (cents: number) =>
  `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function calculateWithdrawalFeeCents(
  amountCents: number,
  fee: IWithdrawalFeeConfig,
): number {
  const variableCents = (amountCents * fee.variable) / 100;
  const fixedCents = fee.fixed * 100;
  const minCents = fee.min * 100;
  return Math.max(0, Math.round(Math.max(variableCents + fixedCents, minCents)));
}

function formatFeeStructure(fee: IWithdrawalFeeConfig): string {
  const parts: string[] = [];
  if (fee.variable > 0) {
    parts.push(`${fee.variable.toFixed(2).replace(".", ",")}%`);
  }
  if (fee.fixed > 0) {
    parts.push(
      `R$ ${fee.fixed.toFixed(2).replace(".", ",")}`,
    );
  }
  if (parts.length === 0) {
    return fee.min > 0
      ? `mínima de ${fmt(Math.round(fee.min * 100))}`
      : "Sem taxa";
  }
  const label = parts.join(" + ");
  if (fee.min > 0) {
    return `${label} (mín. ${fmt(Math.round(fee.min * 100))})`;
  }
  return label;
}

function getPixDestinationLabel(account: IBankData | null): string {
  if (!account?.pixKey) return "Chave PIX não cadastrada";
  const type = account.pixKeyType
    ? PIX_TYPE_LABEL[account.pixKeyType] ?? account.pixKeyType.toUpperCase()
    : null;
  return type ? `${account.pixKey} · ${type}` : account.pixKey;
}

export function WithdrawalModal({
  open,
  onOpenChange,
  availableBalance,
  cardBalance,
  pixBoletoBalance,
  onSuccess,
}: IWithdrawalModalProps) {
  const apiService = useApiService();
  const [step, setStep] = useState<TStep>("amount");
  const [tab, setTab] = useState<TBalanceTab>("pix_boleto");
  const [rawValue, setRawValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<IBankData[]>([]);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [limits, setLimits] = useState<IWithdrawalLimits>({
    min: DEFAULT_MIN,
    max: 0,
    dailyMax: 0,
  });
  const [feeConfig, setFeeConfig] = useState<IWithdrawalFeeConfig>(DEFAULT_FEE);
  const [dailyWithdrawn, setDailyWithdrawn] = useState(0);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [dailyLimitOpen, setDailyLimitOpen] = useState(false);

  const selectedAccount = bankAccounts[selectedAccountIdx] || null;
  const currentBalance = resolveWithdrawalModalBalance({
    showCardBalanceTab: SHOW_CARD_BALANCE_TAB,
    tab,
    availableBalance,
    cardBalance,
    pixBoletoBalance,
  });
  const amountCents = Math.round(
    parseFloat(rawValue.replace(/\./g, "").replace(",", ".") || "0") * 100
  );
  const feeCents =
    amountCents > 0 ? calculateWithdrawalFeeCents(amountCents, feeConfig) : 0;
  const netCents = Math.max(0, amountCents - feeCents);
  const hasFee = feeConfig.fixed > 0 || feeConfig.variable > 0 || feeConfig.min > 0;

  const minAmount = limits.min > 0 ? limits.min : DEFAULT_MIN;
  const maxPerWithdrawal =
    limits.max > 0 ? Math.min(limits.max, currentBalance) : currentBalance;
  const dailyRemaining =
    limits.dailyMax > 0
      ? Math.max(0, limits.dailyMax - dailyWithdrawn)
      : Infinity;
  const effectiveMax = Math.min(
    maxPerWithdrawal,
    dailyRemaining === Infinity ? Infinity : dailyRemaining
  );
  const perTxLimitLabel = limits.max > 0 ? fmt(limits.max) : null;
  const dailyLimitLabel = limits.dailyMax > 0 ? fmt(limits.dailyMax) : null;

  const getValidationError = (): string | null => {
    if (amountCents < minAmount) return `Mínimo de ${fmt(minAmount)}`;
    if (limits.max > 0 && amountCents > limits.max)
      return `Máximo por saque: ${fmt(limits.max)}`;
    if (amountCents > currentBalance) return "Valor excede o saldo disponível";
    if (limits.dailyMax > 0 && amountCents > dailyRemaining)
      return `Limite diário restante: ${fmt(dailyRemaining)}`;
    if (feeCents > 0 && netCents <= 0)
      return "Taxa de saque maior ou igual ao valor solicitado.";
    return null;
  };

  const validationError = rawValue ? getValidationError() : null;
  const isValid =
    amountCents >= minAmount && amountCents <= effectiveMax && !validationError;
  const hasBalance = currentBalance >= minAmount;

  const getAccountLabel = (b: IBankData) => {
    const bank = b.bankName
      ? b.bankName.charAt(0).toUpperCase() + b.bankName.slice(1)
      : "";
    const acc = b.account
      ? `••${b.account.slice(-4)}${b.accountDigit ? `-${b.accountDigit}` : ""}`
      : "";
    return `${bank} ${acc}`.trim() || "Conta";
  };

  useEffect(() => {
    if (!open) return;

    apiService.modules.sellerPortal
      .getWithdrawalContext()
      .then((ctx) => {
        setBankAccounts(
          ctx.bankAccounts.map((b) => ({
            bankName: b.bankName,
            agency: b.agency,
            agencyDigit: b.agencyDigit,
            account: b.account,
            accountDigit: b.accountDigit,
            accountType: b.accountType,
            pixKey: b.pixKey,
            pixKeyType: b.pixKeyType,
          })),
        );
        setSelectedAccountIdx(0);
        setWithdrawalBlocked(ctx.withdrawalsBlocked);
        setBlockReason(ctx.withdrawalBlockReason);
        setLimits({
          min: ctx.limits.withdrawalMinAmount * 100 || DEFAULT_MIN,
          max: ctx.limits.withdrawalMaxAmount * 100,
          dailyMax: ctx.limits.withdrawalDailyMax * 100,
        });
        setFeeConfig({
          fixed: ctx.fee?.withdrawalFixedFee ?? 0,
          variable: ctx.fee?.withdrawalVariableFee ?? 0,
          min: ctx.fee?.withdrawalMinFee ?? 0,
        });
        setDailyWithdrawn(ctx.dailyWithdrawnTotal);
      })
      .catch(() => {
        toast.error("Erro ao carregar dados do saque");
      });
  }, [open, apiService]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await apiService.modules.sellerPortal.requestWithdrawal({
        amount: amountCents,
        description: `Saque - ${
          tab === "card" ? "Vendas Cartão" : "Vendas PIX/Boleto"
        }`,
        balanceSource: tab,
        pixCode: selectedAccount?.pixKey || undefined,
        pixKey: selectedAccount?.pixKey || undefined,
        pixKeyType: selectedAccount?.pixKeyType || undefined,
        bankName: selectedAccount?.bankName || undefined,
        accountType: selectedAccount?.accountType || undefined,
      });
      setStep("success");
      onSuccess();
    } catch {
      toast.error("Erro ao solicitar saque. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setDailyLimitOpen(false);
    setTimeout(() => {
      setStep("amount");
      setRawValue("");
      setTab("pix_boleto");
    }, 200);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && dailyLimitOpen) return;
          if (!nextOpen) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-border/60">
          {step === "amount" && (
            <div className="p-6">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-base font-semibold text-foreground">
                  Solicitar saque
                </DialogTitle>
              </DialogHeader>

              {withdrawalBlocked && (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                  <Lock
                    size={16}
                    className="text-destructive mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Saques bloqueados
                    </p>
                    {blockReason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Motivo: {blockReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {bankAccounts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Building2 size={12} className="text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Conta de destino
                    </span>
                  </div>
                  {bankAccounts.length === 1 ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/40">
                      <span className="text-xs md:text-sm font-medium text-foreground capitalize">
                        {getAccountLabel(bankAccounts[0])}
                      </span>
                      {bankAccounts[0].pixKey && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          PIX: {bankAccounts[0].pixKey}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedAccountIdx}
                        onChange={(e) =>
                          setSelectedAccountIdx(Number(e.target.value))
                        }
                        className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-muted/20 border border-border/40 text-xs md:text-sm font-medium text-foreground capitalize focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
                      >
                        {bankAccounts.map((acc, i) => (
                          <option key={i} value={i}>
                            {getAccountLabel(acc)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {SHOW_CARD_BALANCE_TAB && (
                <div className="flex gap-1 p-1 rounded-xl bg-muted/40 mb-6">
                  <button
                    onClick={() => {
                      setTab("card");
                      setRawValue("");
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                      tab === "card"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CreditCard size={14} />
                    Vendas Cartão
                  </button>
                  <button
                    onClick={() => {
                      setTab("pix_boleto");
                      setRawValue("");
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                      tab === "pix_boleto"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <QrCode size={14} />
                    Vendas PIX/Boleto
                  </button>
                </div>
              )}

              <div className="text-center mb-4">
                <AnimatedBalance cents={currentBalance} />
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Saldo disponível para saque.
                </p>
              </div>

              {!hasBalance ? (
                <div className="text-center mb-5">
                  <p className="text-sm font-medium text-foreground">
                    Você não possui saldo disponível para sacar
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Saques realizados serão efetuados na sua chave PIX em até
                    24h.
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Valor
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={rawValue}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (!digits) {
                          setRawValue("");
                          return;
                        }
                        const numeric = parseInt(digits, 10);
                        const formatted = (numeric / 100).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        );
                        setRawValue(formatted);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border/50 bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
                    />
                  </div>
                  {rawValue && validationError && (
                    <p className="text-xs text-destructive mt-1.5">
                      {validationError}
                    </p>
                  )}
                  {rawValue && amountCents > 0 && hasFee && (
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Taxa de saque: {fmt(feeCents)}</span>
                      <span>
                        Líquido:{" "}
                        <span className="font-medium text-foreground">
                          {fmt(netCents)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2 flex items-start gap-2">
                <Info
                  size={12}
                  className="text-primary mt-0.5 shrink-0"
                />
                <div className="min-w-0 text-[11px] leading-relaxed text-muted-foreground">
                  <p>
                    Saque mínimo {fmt(minAmount)}
                    {limits.max > 0 ? ` · Máximo ${fmt(limits.max)}` : ""}
                    {hasFee ? ` · Taxa ${formatFeeStructure(feeConfig)}` : ""}
                  </p>
                  {limits.dailyMax > 0 && (
                    <p className="mt-0.5">
                      Limite diário restante:{" "}
                      {fmt(dailyRemaining === Infinity ? 0 : dailyRemaining)}
                    </p>
                  )}
                  <p className="mt-0.5">
                    Consulte{" "}
                    <button
                      type="button"
                      onClick={() => setDailyLimitOpen(true)}
                      className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      meu limite diário
                    </button>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Fechar
                </button>
                {hasBalance && !withdrawalBlocked && (
                  <button
                    disabled={!isValid}
                    onClick={() => setStep("confirm")}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                      isValid
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Solicitar
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="p-6">
              <DialogHeader className="mb-5">
                <DialogTitle className="text-base font-semibold text-foreground">
                  Confirmar saque
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5">
                  <AlertTriangle
                    size={14}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    O valor será debitado do seu saldo. Processamento em até 24h
                    úteis.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/20 border border-border/40 divide-y divide-border/30">
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Valor cheio
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-foreground">
                      {fmt(amountCents)}
                    </span>
                  </div>
                  {hasFee && (
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Taxa de saque
                      </span>
                      <span className="text-xs md:text-sm font-medium text-foreground">
                        -{fmt(feeCents)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Valor líquido
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-foreground">
                      {fmt(netCents)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-2.5">
                    <span className="text-xs md:text-sm text-muted-foreground shrink-0">
                      Destino
                    </span>
                    <span className="text-xs md:text-sm font-medium text-foreground text-right break-all">
                      {getPixDestinationLabel(selectedAccount)}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Prazo
                    </span>
                    <span className="text-xs md:text-sm font-medium text-foreground">
                      Até 24h úteis
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    onClick={() => setStep("amount")}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={loading}
                    onClick={handleConfirm}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    {loading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Confirmar saque"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Saque solicitado!
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-5">
                Seu saque de {fmt(amountCents)}
                {hasFee && feeCents > 0
                  ? ` (líquido ${fmt(netCents)})`
                  : ""}{" "}
                foi registrado e está em processamento.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
              >
                Fechar
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dailyLimitOpen} onOpenChange={setDailyLimitOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Meu limite diário
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes do limite diário de saque
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 flex items-start gap-2.5">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {perTxLimitLabel ? (
                <>
                  Devido à nova regulamentação do Banco Central sobre fintechs,
                  os saques estão{" "}
                  <span className="font-semibold text-foreground">
                    limitados a {perTxLimitLabel} por transação
                  </span>
                  . Você pode fazer{" "}
                  <span className="font-semibold text-foreground">
                    várias transações de até {perTxLimitLabel} no mesmo dia
                  </span>
                  , sem problema.
                </>
              ) : (
                <>
                  Você pode solicitar mais de um saque no mesmo dia.
                  {dailyLimitLabel
                    ? ` O limite diário da sua conta é ${dailyLimitLabel}.`
                    : ""}
                </>
              )}
              {perTxLimitLabel && dailyLimitLabel && (
                <>
                  {" "}
                  O limite diário da sua conta é{" "}
                  <span className="font-semibold text-foreground">
                    {dailyLimitLabel}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
