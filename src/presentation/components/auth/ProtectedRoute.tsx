import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "seller";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, role, loading, isBanned, signOut } = useAuthStore();

  if (loading || (user && role === null)) {
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

  if (!user) {
    return <Navigate to="/login/seller" replace />;
  }

  // Banned seller screen
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
    return <Navigate to={role === "admin" ? "/admin" : "/seller"} replace />;
  }

  return <>{children}</>;
}
