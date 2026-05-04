import ScrollToTop from "@/http/components/ScrollToTop";
import { AuthProvider } from "@/http/components/auth/AuthProvider";
import { ProtectedRoute } from "@/http/components/auth/ProtectedRoute";
import { Toaster as Sonner } from "@/http/components/ui/sonner";
import { Toaster } from "@/http/components/ui/toaster";
import { TooltipProvider } from "@/http/components/ui/tooltip";
import { useGatewayTheme } from "@/http/hooks/use-gateway-theme";
import { ThemeProvider } from "@/http/hooks/use-theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginAdmin from "./http/pages/LoginAdminPage";
import LoginSellerPage from "./http/pages/LoginSellerPage";
import ResetPassword from "./http/pages/ResetPassword";
import SellerDashboard from "./http/pages/SellerDashboard";
import Admin2FA from "./http/pages/admin/Admin2FA";
import AdminAcquirer from "./http/pages/admin/AdminAcquirer";
import AdminBanners from "./http/pages/admin/AdminBanners";
import AdminCrm from "./http/pages/admin/AdminCrm";
import AdminDashboard from "./http/pages/admin/AdminDashboard";
import AdminEmail from "./http/pages/admin/AdminEmail";
import AdminGeneral from "./http/pages/admin/AdminGeneral";
import AdminGlobalFees from "./http/pages/admin/AdminGlobalFees";
import AdminGoals from "./http/pages/admin/AdminGoals";
import AdminKyc from "./http/pages/admin/AdminKyc";
import AdminManagers from "./http/pages/admin/AdminManagers";
import AdminRefunds from "./http/pages/admin/AdminRefunds";
import AdminSellers from "./http/pages/admin/AdminSellers";
import AdminSubscriptions from "./http/pages/admin/AdminSubscriptions";
import AdminTransactions from "./http/pages/admin/AdminTransactions";
import AdminWithdrawals from "./http/pages/admin/AdminWithdrawals";
import Seller2FA from "./http/pages/seller/Seller2FA";
import SellerApi from "./http/pages/seller/SellerApi";
import SellerApiDocs from "./http/pages/seller/SellerApiDocs";
import SellerApps from "./http/pages/seller/SellerApps";
import SellerDeposit from "./http/pages/seller/SellerDeposit";
import SellerKyc from "./http/pages/seller/SellerKyc";
import SellerSettings from "./http/pages/seller/SellerSettings";
import SellerTransactions from "./http/pages/seller/SellerTransactions";
import SellerTransfers from "./http/pages/seller/SellerTransfers";
const queryClient = new QueryClient();

function ThemeLoader() {
  useGatewayTheme();
  return null;
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
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
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/seller"
                element={
                  <ProtectedRoute requiredRole="seller">
                    <SellerDashboard />
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
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
