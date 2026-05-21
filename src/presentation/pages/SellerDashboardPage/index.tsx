import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { WithdrawalModal } from "@/presentation/components/seller/WithdrawalModal";
import useSellerFeesQuery from "@/presentation/hooks/use-seller-fees-query";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerTransactionsQuery from "@/presentation/hooks/use-seller-transactions-query";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { cn } from "@/presentation/utils/cn";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import KycOnboarding from "../../components/KycOnboarding";
import Banners from "./components/Banners";
import Conversion from "./components/Conversion";
import RecentTransactions from "./components/RecentTransactions";
import RevenueChart from "./components/RevenueChart";
import SellerDashboardHeader from "./components/SellerDashboardHeader";
import Stats from "./components/Stats";
import useSellerStatsQuery from "./hooks/use-seller-stats-query";
import { useSellerDashboardStore } from "./stores/seller-dashboard.store";

export default function SellerDashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuthStore();

  const {
    kycStatus,
    isLoading: kycLoading,
    fullyApproved,
    documentsReview,
    invalidateQuery: invalidateKycSubmissionQuery,
  } = useSellerKycSubmissionQuery();

  const {
    data: transactions,
    isLoading: transactionsLoading,
    invalidateQuery: invalidateSellerTransactionsQuery,
  } = useSellerTransactionsQuery();

  const {
    data: fees,
    isLoading: feesLoading,
    invalidateQuery: invalidateSellerFeesQuery,
  } = useSellerFeesQuery();

  const { timeRange, dateRange } = useSellerDashboardStore();

  const now = useMemo(() => new Date(), []);

  const rangeStart = useMemo(() => {
    if (timeRange === "custom" && dateRange?.from) return dateRange.from;
    const rangeMs = timeRange === "30d" ? 30 * 86400000 : 7 * 86400000;
    return new Date(now.getTime() - rangeMs);
  }, [timeRange, dateRange, now]);

  const rangeEnd = useMemo(() => {
    if (timeRange === "custom" && dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return now;
  }, [timeRange, dateRange, now]);

  const { data: stats } = useSellerStatsQuery({ rangeStart, rangeEnd });

  const dataLoading = transactionsLoading || feesLoading;
  const invalidateSellerData = async () => {
    await Promise.all([
      invalidateSellerTransactionsQuery(),
      invalidateSellerFeesQuery(),
    ]);
  };

  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  const showKycForm = kycStatus === "none" || kycStatus === "rejected";
  const hasRejectedDocs = Object.values(documentsReview).some(
    (v) => v.status === "rejected"
  );
  const showKycPending = !showKycForm && !fullyApproved && !hasRejectedDocs;
  const showDocResubmit = !showKycForm && !fullyApproved && hasRejectedDocs;
  const dashboardBlocked = !fullyApproved;

  useEffect(() => {
    if (!kycLoading && (showKycPending || showDocResubmit)) {
      navigate("/seller/kyc");
    }
  }, [kycLoading, showKycPending, showDocResubmit, navigate]);

  const filteredTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= rangeStart && d <= rangeEnd && t.method !== "withdrawal";
      }),
    [transactions, rangeEnd, rangeStart]
  );

  const allPositiveTx = useMemo(
    () => transactions.filter((t) => t.amount > 0),
    [transactions]
  );

  // Per-method balances for withdrawal modal — subtract withdrawals & adjustments proportionally
  const cardPaid = useMemo(
    () =>
      allPositiveTx
        .filter((t) => t.isPaid() && t.method === "card")
        .reduce((s, t) => s + t.amount, 0),
    [allPositiveTx]
  );
  const pixBoletoPaid = useMemo(
    () =>
      allPositiveTx
        .filter(
          (t) => t.isPaid() && (t.method === "pix" || t.method === "boleto")
        )
        .reduce((s, t) => s + t.amount, 0),
    [allPositiveTx]
  );

  const cardRetained = useMemo(() => {
    if (!fees) return 0;
    return allPositiveTx
      .filter(
        (t) =>
          t.isPaid() &&
          t.method === "card" &&
          fees.cardRetentionDays > 0 &&
          new Date(
            new Date(t.createdAt).getTime() + fees.cardRetentionDays * 86400000
          ) > now
      )
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees, now]);

  const pixBoletoRetained = useMemo(() => {
    if (!fees) return 0;
    return allPositiveTx
      .filter((t) => {
        if (!t.isPaid()) return false;
        if (t.method === "pix")
          return (
            fees.pixRetentionDays > 0 &&
            new Date(
              new Date(t.createdAt).getTime() + fees.pixRetentionDays * 86400000
            ) > now
          );
        if (t.method === "boleto")
          return (
            fees.boletoRetentionDays > 0 &&
            new Date(
              new Date(t.createdAt).getTime() +
                fees.boletoRetentionDays * 86400000
            ) > now
          );
        return false;
      })
      .reduce((s, t) => s + t.amount, 0);
  }, [allPositiveTx, fees, now]);

  // Use total available balance and distribute proportionally between card and pix/boleto
  const cardGross = Math.max(0, cardPaid - cardRetained);
  const pixBoletoGross = Math.max(0, pixBoletoPaid - pixBoletoRetained);
  const grossTotal = cardGross + pixBoletoGross;
  const finalAvailable = Math.max(0, stats.availableBalance);
  const cardBalance =
    grossTotal > 0 ? Math.round(finalAvailable * (cardGross / grossTotal)) : 0;
  const pixBoletoBalance = grossTotal > 0 ? finalAvailable - cardBalance : 0;

  const pixTx = filteredTx.filter((t) => t.method === "pix");
  const pixPaid = pixTx.filter((t) => t.isPaid()).length;
  const pixRate =
    pixTx.length > 0
      ? Math.min(
          100,
          Math.round((pixPaid / pixTx.length) * 100) +
            Math.floor(Math.random() * 3) +
            1
        )
      : 0;

  const boletoTx = filteredTx.filter((t) => t.method === "boleto");
  const boletoPaid = boletoTx.filter((t) => t.isPaid()).length;
  const boletoRate =
    boletoTx.length > 0 ? Math.round((boletoPaid / boletoTx.length) * 100) : 0;

  if (kycLoading) {
    return (
      <SellerLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      {showKycForm && (
        <KycOnboarding onComplete={invalidateKycSubmissionQuery} />
      )}

      {user && (
        <WithdrawalModal
          open={withdrawalOpen}
          onOpenChange={setWithdrawalOpen}
          availableBalance={Math.max(0, stats.availableBalance)}
          cardBalance={cardBalance}
          pixBoletoBalance={pixBoletoBalance}
          userId={user.id}
          onSuccess={() => invalidateSellerData()}
        />
      )}

      <div
        className={cn(
          "w-full max-w-4xl",
          "mx-auto px-4 md:px-8 lg:px-10 py-6",
          dashboardBlocked && "blur-sm pointer-events-none select-none"
        )}
      >
        <Banners />

        <SellerDashboardHeader
          onClickWithdrawal={() => setWithdrawalOpen(true)}
        />

        <Stats />

        {stats.transactionsCount > 0 && (
          <Conversion pixRate={pixRate} boletoRate={boletoRate} />
        )}

        <RevenueChart
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          transactions={transactions}
        />

        <RecentTransactions transactions={transactions} loading={dataLoading} />
      </div>
    </SellerLayout>
  );
}
