import { AuthLoadingScreen } from "@/presentation/components/auth/AuthLoadingScreen";
import { LOGIN_PATH, homePathForRole } from "@/presentation/components/auth/auth-paths";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { UserContextProvider } from "@/presentation/context/UserContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "seller";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, role, isLoading, isBanned, signOut } = useAuthContext();

  const canKeepProtectedTree =
    !!user &&
    !!role &&
    (!requiredRole || role === requiredRole) &&
    !(isBanned && role === "seller");

  if (isLoading) {
    if (canKeepProtectedTree && user) {
      return <UserContextProvider user={user}>{children}</UserContextProvider>;
    }
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  if (isBanned && role === "seller") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m4.9 4.9 14.2 14.2" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Conta suspensa
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Sua conta foi suspensa por um administrador. Entre em contato com o
          suporte para mais informações.
        </p>
        <button
          onClick={signOut}
          className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Sair
        </button>
      </div>
    );
  }

  if (requiredRole && role !== requiredRole) {
    if (!role) return <Navigate to={LOGIN_PATH} replace />;
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <UserContextProvider user={user}>{children}</UserContextProvider>;
}
