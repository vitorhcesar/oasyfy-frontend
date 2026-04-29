import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/http/components/ui/dialog";
import { cn } from "@/http/utils/cn";
import { supabase } from "@/infra/integrations/supabase/client";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

interface BankData {
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  account?: string;
  accountDigit?: string;
  accountType?: string;
  pixKey?: string;
  pixKeyType?: string;
}

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  cardBalance: number;
  pixBoletoBalance: number;
  userId: string;
  onSuccess: () => void;
}

type Step = "amount" | "confirm" | "success";
type BalanceTab = "card" | "pix_boleto";

interface WithdrawalLimits {
  min: number; // cents
  max: number; // cents (0 = no limit)
  dailyMax: number; // cents (0 = no limit)
}

const DEFAULT_MIN = 200; // R$ 2,00

export function WithdrawalModal({
  open,
  onOpenChange,
  availableBalance,
  cardBalance,
  pixBoletoBalance,
  userId,
  onSuccess,
}: WithdrawalModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [tab, setTab] = useState<BalanceTab>("card");
  const [rawValue, setRawValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankData[]>([]);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0);
  const [limits, setLimits] = useState<WithdrawalLimits>({
    min: DEFAULT_MIN,
    max: 0,
    dailyMax: 0,
  });
  const [dailyWithdrawn, setDailyWithdrawn] = useState(0);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  const selectedAccount = bankAccounts[selectedAccountIdx] || null;
  const currentBalance = tab === "card" ? cardBalance : pixBoletoBalance;
  const amountCents = Math.round(
    parseFloat(rawValue.replace(/\./g, "").replace(",", ".") || "0") * 100
  );

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

  const getValidationError = (): string | null => {
    if (amountCents < minAmount) return `Mínimo de ${fmt(minAmount)}`;
    if (limits.max > 0 && amountCents > limits.max)
      return `Máximo por saque: ${fmt(limits.max)}`;
    if (amountCents > currentBalance) return "Valor excede o saldo disponível";
    if (limits.dailyMax > 0 && amountCents > dailyRemaining)
      return `Limite diário restante: ${fmt(dailyRemaining)}`;
    return null;
  };

  const validationError = rawValue ? getValidationError() : null;
  const isValid =
    amountCents >= minAmount && amountCents <= effectiveMax && !validationError;
  const hasBalance = currentBalance >= minAmount;

  const fmt = (cents: number) =>
    `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const getAccountLabel = (b: BankData) => {
    const bank = b.bankName
      ? b.bankName.charAt(0).toUpperCase() + b.bankName.slice(1)
      : "";
    const acc = b.account
      ? `••${b.account.slice(-4)}${b.accountDigit ? `-${b.accountDigit}` : ""}`
      : "";
    return `${bank} ${acc}`.trim() || "Conta";
  };

  useEffect(() => {
    if (open && userId) {
      // Fetch bank data + blocked status
      supabase
        .from("kyc_submissions")
        .select("bank_data, withdrawals_blocked, withdrawal_block_reason")
        .eq("user_id", userId)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data?.bank_data) {
            const raw = data.bank_data as unknown;
            const accounts = Array.isArray(raw)
              ? (raw as BankData[])
              : [raw as BankData];
            setBankAccounts(accounts);
            setSelectedAccountIdx(0);
          }
          setWithdrawalBlocked(data?.withdrawals_blocked || false);
          setBlockReason((data as any)?.withdrawal_block_reason || null);
        });

      // Fetch withdrawal limits
      supabase
        .from("seller_fees")
        .select(
          "withdrawal_min_amount, withdrawal_max_amount, withdrawal_daily_max"
        )
        .eq("seller_id", userId)
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) {
            setLimits({
              min: (data.withdrawal_min_amount || 0) * 100 || DEFAULT_MIN,
              max: (data.withdrawal_max_amount || 0) * 100,
              dailyMax: (data.withdrawal_daily_max || 0) * 100,
            });
          }
        });

      // Fetch today's approved withdrawals total
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      supabase
        .from("transactions")
        .select("amount")
        .eq("seller_id", userId)
        .eq("method", "withdrawal")
        .in("status", ["pending", "approved"])
        .gte("created_at", todayStart.toISOString())
        .then(({ data }) => {
          if (data) {
            const total = data.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            setDailyWithdrawn(total);
          }
        });
    }
  }, [open, userId]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        seller_id: userId,
        amount: -amountCents,
        method: "withdrawal",
        status: "pending",
        customer_name: "Saque",
        description: `Saque - ${
          tab === "card" ? "Vendas Cartão" : "Vendas PIX/Boleto"
        }`,
        pix_code: selectedAccount?.pixKey || null,
        metadata: {
          pix_key: selectedAccount?.pixKey || null,
          pix_key_type: selectedAccount?.pixKeyType || null,
          bank_name: selectedAccount?.bankName || null,
          account_type: selectedAccount?.accountType || null,
          balance_source: tab,
        },
      });
      if (error) throw error;
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
    setTimeout(() => {
      setStep("amount");
      setRawValue("");
      setTab("card");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

            {/* Bank account selector - compact */}
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

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted/40 mb-6">
              <button
                onClick={() => {
                  setTab("card");
                  setRawValue("");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-all",
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
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium transition-all",
                  tab === "pix_boleto"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <QrCode size={14} />
                Vendas PIX/Boleto
              </button>
            </div>

            {/* Balance display */}
            <div className="text-center mb-4">
              <AnimatedBalance cents={currentBalance} />
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Saldo disponível para saque.
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Saque mínimo: {fmt(minAmount)}
              </p>
              {limits.max > 0 && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  Máximo por saque: {fmt(limits.max)}
                </p>
              )}
              {limits.dailyMax > 0 && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  Limite diário restante:{" "}
                  {fmt(dailyRemaining === Infinity ? 0 : dailyRemaining)}
                </p>
              )}
            </div>

            {!hasBalance ? (
              <div className="text-center mb-5">
                <p className="text-[13px] font-medium text-foreground">
                  Você não possui saldo disponível para sacar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Saques realizados serão efetuados na sua conta bancária em até
                  24h.
                </p>
              </div>
            ) : (
              <div className="mb-5">
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
                <p className="text-xs text-muted-foreground mt-2">
                  Saques realizados serão efetuados na sua conta bancária em até
                  24h.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClose}
                className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Fechar
              </button>
              {hasBalance && !withdrawalBlocked && (
                <button
                  disabled={!isValid}
                  onClick={() => setStep("confirm")}
                  className={cn(
                    "px-5 py-2 rounded-lg text-[12px] font-medium transition-all",
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
                    Valor
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-foreground">
                    {fmt(amountCents)}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    Origem
                  </span>
                  <span className="text-xs md:text-sm font-medium text-foreground">
                    {tab === "card" ? "Vendas Cartão" : "Vendas PIX/Boleto"}
                  </span>
                </div>
                {selectedAccount && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Destino
                    </span>
                    <span className="text-xs md:text-sm font-medium text-foreground capitalize">
                      {getAccountLabel(selectedAccount)}
                    </span>
                  </div>
                )}
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
                  className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voltar
                </button>
                <button
                  disabled={loading}
                  onClick={handleConfirm}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-all flex items-center gap-1.5"
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
              Seu saque de {fmt(amountCents)} foi registrado e está em
              processamento.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-all"
            >
              Fechar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
