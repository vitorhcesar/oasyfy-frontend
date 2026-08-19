import ScrollToTop from "@/presentation/components/ScrollToTop";
import { ProtectedRoute } from "@/presentation/components/auth/ProtectedRoute";
import { PublicRoute } from "@/presentation/components/auth/PublicRoute";
import { Toaster as Sonner } from "@/presentation/components/ui/sonner";
import { Toaster } from "@/presentation/components/ui/toaster";
import { TooltipProvider } from "@/presentation/components/ui/tooltip";
import { AuthContextProvider } from "@/presentation/context/AuthContext";
import { ThemeProvider } from "@/presentation/hooks/use-theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import useGatewayTheme from "./presentation/hooks/use-gateway-theme";
import AdminBanners from "./presentation/pages/AdminBannersPage";
import AdminDashboardPage from "./presentation/pages/AdminDashboardPage";
import AdminGeneralPage from "./presentation/pages/AdminGeneralPage";
import AdminKycPage from "./presentation/pages/AdminKycPage";
import LoginSellerPage from "./presentation/pages/LoginSellerPage";
import ResetPasswordPage from "./presentation/pages/ResetPasswordPage";
import TermsOfUsePage from "./presentation/pages/TermsOfUsePage";
import SellerDashboardPage from "./presentation/pages/SellerDashboardPage";
import Admin2FA from "./presentation/pages/admin/Admin2FA";
import AdminAcquirer from "./presentation/pages/admin/AdminAcquirer";
import AdminAcquirerConnectionConfigPage from "./presentation/pages/admin/AdminAcquirerConnectionConfigPage";
import AdminCrm from "./presentation/pages/admin/AdminCrm";
import AdminEmail from "./presentation/pages/admin/AdminEmail";
import AdminFeeTemplates from "./presentation/pages/admin/AdminFeeTemplates";
import AdminFeeTemplateFormPage from "./presentation/pages/admin/AdminFeeTemplateFormPage";
import AdminGoals from "./presentation/pages/admin/AdminGoals";
import AdminManagers from "./presentation/pages/admin/AdminManagers";
import AdminRefunds from "./presentation/pages/admin/AdminRefunds";
import AdminSubscriptions from "./presentation/pages/admin/AdminSubscriptions";
import AdminTransactionsPage from "./presentation/pages/AdminTransactionsPage";
import AdminWebhooksPage from "./presentation/pages/AdminWebhooksPage";
import AdminWithdrawalsPage from "./presentation/pages/AdminWithdrawalsPage";
import Seller2FA from "./presentation/pages/seller/Seller2FA";
import SellerApi from "./presentation/pages/seller/SellerApi";
import PublicApiDocs from "./presentation/pages/docs/PublicApiDocs";
import SellerApps from "./presentation/pages/seller/SellerApps";
import SellerDeposit from "./presentation/pages/seller/SellerDeposit";
import SellerPartners from "./presentation/pages/seller/SellerPartners";
import SellerCheckouts from "./presentation/pages/seller/SellerCheckouts";
import SellerCheckoutNew from "./presentation/pages/seller/SellerCheckoutNew";
import SellerCheckoutDetail from "./presentation/pages/seller/SellerCheckoutDetail";
import PublicCheckoutEntry from "./presentation/pages/PublicCheckoutEntry";
import CheckoutHealthPage from "./presentation/pages/CheckoutHealthPage";
import AdminCheckout from "./presentation/pages/admin/AdminCheckout";
import AdminPracaPage from "./presentation/pages/admin/AdminPraca";
import SellerKyc from "./presentation/pages/seller/SellerKyc";
import SellerSettings from "./presentation/pages/seller/SellerSettings";
import SellerNotifications from "./presentation/pages/seller/SellerNotifications";
import SellerPraca from "./presentation/pages/seller/SellerPraca";
import SellerTransactions from "./presentation/pages/seller/SellerTransactions";
import SellerTransfers from "./presentation/pages/seller/SellerTransfers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeLoader() {
  useGatewayTheme();
  return null;
}

function RedirectSellerToKyc() {
  const { sellerId } = useParams();
  return (
    <Navigate
      to={sellerId ? `/admin/kyc?sellerId=${sellerId}` : "/admin/kyc"}
      replace
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={400} disableHoverableContent>
          <Toaster />
          <Sonner />
          <ThemeLoader />
          <BrowserRouter>
            <ScrollToTop />
            <AuthContextProvider>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginSellerPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/login/admin"
                  element={<Navigate to="/login" replace />}
                />
                <Route
                  path="/login/seller"
                  element={<Navigate to="/login" replace />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/termos" element={<TermsOfUsePage />} />
                <Route path="/docs" element={<PublicApiDocs />} />
                <Route path="/docs/*" element={<PublicApiDocs />} />
                <Route
                  path="/seller/api-docs"
                  element={<Navigate to="/docs" replace />}
                />
                <Route path="/c/__health" element={<CheckoutHealthPage />} />
                <Route path="/c/:publicId" element={<PublicCheckoutEntry />} />
                <Route
                  path="/seller"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/kyc"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerKyc />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/settings"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/notifications"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/praca"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerPraca />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/api"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerApi />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/transactions"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerTransactions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/2fa"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <Seller2FA />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/apps"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerApps />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/transfers"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerTransfers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/deposit"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerDeposit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/partners"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerPartners />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/checkouts"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerCheckouts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/checkouts/new"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerCheckoutNew />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/checkouts/:id"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerCheckoutDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/kyc"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminKycPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sellers"
                  element={<Navigate to="/admin/kyc" replace />}
                />
                <Route
                  path="/admin/sellers/:sellerId"
                  element={<RedirectSellerToKyc />}
                />
                <Route
                  path="/admin/praca"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPracaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/transactions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminTransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/webhooks"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminWebhooksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/banners"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminBanners />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/general"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminGeneralPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/fee-templates/create"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminFeeTemplateFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/fee-templates/:id"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminFeeTemplateFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/fee-templates"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminFeeTemplates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/acquirer/:provider"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAcquirerConnectionConfigPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/acquirer"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAcquirer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/subscriptions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSubscriptions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/withdrawals"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminWithdrawalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/goals"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminGoals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/refunds"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminRefunds />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/email"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminEmail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/crm"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCrm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/checkout"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCheckout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/2fa"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin2FA />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/managers"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminManagers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to="/login" replace />}
                />
              </Routes>
            </AuthContextProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
