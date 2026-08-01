import ScrollToTop from "@/presentation/components/ScrollToTop";
import { ProtectedRoute } from "@/presentation/components/auth/ProtectedRoute";
import { Toaster as Sonner } from "@/presentation/components/ui/sonner";
import { Toaster } from "@/presentation/components/ui/toaster";
import { TooltipProvider } from "@/presentation/components/ui/tooltip";
import { AuthContextProvider, useAuthContext } from "@/presentation/context/AuthContext";
import { ThemeProvider } from "@/presentation/hooks/use-theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import useGatewayTheme from "./presentation/hooks/use-gateway-theme";
import AdminBanners from "./presentation/pages/AdminBannersPage";
import AdminDashboardPage from "./presentation/pages/AdminDashboardPage";
import AdminGeneralPage from "./presentation/pages/AdminGeneralPage";
import AdminKycPage from "./presentation/pages/AdminKycPage";
import AdminSellersPage from "./presentation/pages/AdminSellersPage";
import LoginAdmin from "./presentation/pages/LoginAdminPage";
import LoginSellerPage from "./presentation/pages/LoginSellerPage";
import ResetPasswordPage from "./presentation/pages/ResetPasswordPage";
import SellerDashboardPage from "./presentation/pages/SellerDashboardPage";
import Admin2FA from "./presentation/pages/admin/Admin2FA";
import AdminAcquirer from "./presentation/pages/admin/AdminAcquirer";
import AdminAcquirerConnectionConfigPage from "./presentation/pages/admin/AdminAcquirerConnectionConfigPage";
import AdminCrm from "./presentation/pages/admin/AdminCrm";
import AdminEmail from "./presentation/pages/admin/AdminEmail";
import AdminFeeTemplates from "./presentation/pages/admin/AdminFeeTemplates";
import AdminFeeTemplateFormPage from "./presentation/pages/admin/AdminFeeTemplateFormPage";
import AdminGlobalFees from "./presentation/pages/admin/AdminGlobalFees";
import AdminGoals from "./presentation/pages/admin/AdminGoals";
import AdminManagers from "./presentation/pages/admin/AdminManagers";
import AdminRefunds from "./presentation/pages/admin/AdminRefunds";
import AdminSubscriptions from "./presentation/pages/admin/AdminSubscriptions";
import AdminTransactionsPage from "./presentation/pages/AdminTransactionsPage";
import AdminWithdrawalsPage from "./presentation/pages/AdminWithdrawalsPage";
import Seller2FA from "./presentation/pages/seller/Seller2FA";
import SellerApi from "./presentation/pages/seller/SellerApi";
import SellerApiDocs from "./presentation/pages/seller/SellerApiDocs";
import SellerApps from "./presentation/pages/seller/SellerApps";
import SellerDeposit from "./presentation/pages/seller/SellerDeposit";
import SellerPartners from "./presentation/pages/seller/SellerPartners";
import SellerKyc from "./presentation/pages/seller/SellerKyc";
import SellerSettings from "./presentation/pages/seller/SellerSettings";
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

/**
 * Guard para rotas públicas (login).
 * Redireciona usuários já autenticados para o dashboard correto
 * evitando que acessem a tela de login após estarem logados.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          <div
            className="absolute inset-[6px] rounded-full border-[3px] border-transparent border-b-primary/50"
            style={{ animation: "spin 1.2s linear infinite reverse" }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Carregando...
        </p>
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={role === "admin" ? "/admin" : "/seller"} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ThemeLoader />
          <BrowserRouter>
            <ScrollToTop />
            <AuthContextProvider>
              <Routes>
                <Route
                  path="/login/admin"
                  element={
                    <PublicRoute>
                      <LoginAdmin />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/login/seller"
                  element={
                    <PublicRoute>
                      <LoginSellerPage />
                    </PublicRoute>
                  }
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                  path="/seller/api"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerApi />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/api-docs"
                  element={
                    <ProtectedRoute requiredRole="seller">
                      <SellerApiDocs />
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
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSellersPage />
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
                  path="/admin/global-fees"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminGlobalFees />
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
                  element={<Navigate to="/login/seller" replace />}
                />
              </Routes>
            </AuthContextProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
