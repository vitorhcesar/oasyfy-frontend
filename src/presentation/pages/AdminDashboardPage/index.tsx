import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { Loader2 } from "lucide-react";
import AdminDashboardPageHeader from "./components/AdminDashboardPageHeader";
import FeesChart from "./components/FeesChart";
import FinancialCards from "./components/FinancialCards";
import PeakHour from "./components/PeakHour";
import QuickActions from "./components/QuickActions";
import RevenueChart from "./components/RevenueChart";
import SecondaryMetrics from "./components/SecondaryMetrics";
import StatusAndMethod from "./components/StatusAndMethod";
import StatusCards from "./components/StatusCards";
import TopSellers from "./components/TopSellers";
import useChartData from "./hooks/use-chart-data";
import useCutoff from "./hooks/use-cutoff";
import useFilterTransactions from "./hooks/use-filter-transactions";
import usePlatformMetricsQuery from "./hooks/use-platform-metrics-query";
import { useAdminDashboardPageStore } from "./stores/admin-dashboard-page.store";

export default function AdminDashboardPage() {
  const { data: metrics, isLoading } = usePlatformMetricsQuery();
  const { transactions } = metrics;

  const { period, customFrom, customTo } = useAdminDashboardPageStore();

  const { cutoff, cutoffEnd } = useCutoff({ period, customFrom, customTo });

  const {
    completedTransactions,
    pendingTransactions,
    failedTransactions,
    refundedTransactions,
  } = useFilterTransactions({ transactions, cutoff, cutoffEnd });

  const chartData = useChartData({ completedTransactions, cutoff, cutoffEnd });

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 md:py-9">
        <AdminDashboardPageHeader />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <StatusCards metrics={metrics} />

            <FinancialCards />

            <SecondaryMetrics />

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <RevenueChart
                chartData={chartData}
                completedTransactionsCount={completedTransactions.length}
                pendingTransactionsCount={pendingTransactions.length}
                failedTransactionsCount={failedTransactions.length}
              />

              <StatusAndMethod
                completedTransactions={completedTransactions}
                pendingTransactions={pendingTransactions}
                failedTransactions={failedTransactions}
                refundedTransactions={refundedTransactions}
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <FeesChart chartData={chartData} />
              <PeakHour completedTransactions={completedTransactions} />
              <TopSellers />
            </div>

            <QuickActions />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
