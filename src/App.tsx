import ScrollToTop from "@/presentation/components/ScrollToTop";
import { AuthProvider } from "@/presentation/components/auth/AuthProvider";
import { ProtectedRoute } from "@/presentation/components/auth/ProtectedRoute";
import { Toaster as Sonner } from "@/presentation/components/ui/sonner";
import { Toaster } from "@/presentation/components/ui/toaster";
import { TooltipProvider } from "@/presentation/components/ui/tooltip";
import { useGatewayTheme } from "@/presentation/hooks/use-gateway-theme";
import { ThemeProvider } from "@/presentation/hooks/use-theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginAdmin from "./presentation/pages/LoginAdminPage";
import LoginSellerPage from "./presentation/pages/LoginSellerPage";
import ResetPasswordPage from "./presentation/pages/ResetPasswordPage";
import SellerDashboardPage from "./presentation/pages/SellerDashboardPage";
import Admin2FA from "./presentation/pages/admin/Admin2FA";
import AdminAcquirer from "./presentation/pages/admin/AdminAcquirer";
import AdminBanners from "./presentation/pages/admin/AdminBanners";
import AdminCrm from "./presentation/pages/admin/AdminCrm";
import AdminDashboard from "./presentation/pages/admin/AdminDashboard";
import AdminEmail from "./presentation/pages/admin/AdminEmail";
import AdminGeneral from "./presentation/pages/admin/AdminGeneral";
import AdminGlobalFees from "./presentation/pages/admin/AdminGlobalFees";
import AdminGoals from "./presentation/pages/admin/AdminGoals";
import AdminKyc from "./presentation/pages/admin/AdminKyc";
import AdminManagers from "./presentation/pages/admin/AdminManagers";
import AdminRefunds from "./presentation/pages/admin/AdminRefunds";
import AdminSellers from "./presentation/pages/admin/AdminSellers";
import AdminSubscriptions from "./presentation/pages/admin/AdminSubscriptions";
import AdminTransactions from "./presentation/pages/admin/AdminTransactions";
import AdminWithdrawals from "./presentation/pages/admin/AdminWithdrawals";
import Seller2FA from "./presentation/pages/seller/Seller2FA";
import SellerApi from "./presentation/pages/seller/SellerApi";
import SellerApiDocs from "./presentation/pages/seller/SellerApiDocs";
import SellerApps from "./presentation/pages/seller/SellerApps";
import SellerDeposit from "./presentation/pages/seller/SellerDeposit";
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
            <AuthProvider>
              <Routes>
                <Route path="/login/admin" element={<LoginAdmin />} />
                <Route path="/login/seller" element={<LoginSellerPage />} />
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
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/kyc"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminKyc />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/sellers"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSellers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/transactions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminTransactions />
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
                      <AdminGeneral />
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
                      <AdminWithdrawals />
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
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
