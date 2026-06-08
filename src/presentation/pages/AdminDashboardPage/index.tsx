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
  const { transactions, sellerProfiles } = metrics;

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
      <div className="px-4 md:px-8 py-4 max-w-7xl mx-auto w-full">
        <AdminDashboardPageHeader />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <StatusCards metrics={metrics} />

            <FinancialCards />

            <SecondaryMetrics />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <FeesChart chartData={chartData} />
              <PeakHour completedTransactions={completedTransactions} />
              <TopSellers
                completedTransactions={completedTransactions}
                sellerProfiles={sellerProfiles}
              />
            </div>

            <QuickActions />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
