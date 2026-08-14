import { AuthLoadingScreen } from "@/presentation/components/auth/AuthLoadingScreen";
import { homePathForRole } from "@/presentation/components/auth/auth-paths";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { isLoginInFlight } from "./portal-login-lock";

interface IPublicRouteProps {
  children: React.ReactNode;
}

/**
 * Guard para rotas públicas (login).
 * Redireciona usuários já autenticados para o dashboard do papel,
 * mas não desmonta o formulário no meio de um login em andamento
 * nem em um refetch de sessão depois que a tela já foi exibida.
 */
export function PublicRoute({ children }: IPublicRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuthContext();
  const hasShownPublicContent = useRef(false);

  if (isLoginInFlight()) {
    hasShownPublicContent.current = true;
    return <>{children}</>;
  }

  if (isAuthenticated && role) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  if (isLoading && !hasShownPublicContent.current) {
    return <AuthLoadingScreen />;
  }

  hasShownPublicContent.current = true;
  return <>{children}</>;
}
