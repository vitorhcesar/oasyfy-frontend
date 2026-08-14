import { AuthLoadingScreen } from "@/presentation/components/auth/AuthLoadingScreen";
import { homePathForRole } from "@/presentation/components/auth/auth-paths";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { Navigate } from "react-router-dom";
import { isLoginInFlight } from "./portal-login-lock";

interface IPublicRouteProps {
  children: React.ReactNode;
}

/**
 * Guard para rotas públicas (login).
 * Redireciona usuários já autenticados para o dashboard do papel,
 * mas não desmonta o formulário no meio de um login em andamento.
 */
export function PublicRoute({ children }: IPublicRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuthContext();

  if (isLoginInFlight()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && role) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <>{children}</>;
}
