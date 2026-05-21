import { authClient } from "@/infra/auth/auth-client";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sessionQuery = authClient.useSession();
  const setAuthSession = useAuthStore((s) => s.setAuthSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const fetchRole = useAuthStore((s) => s.fetchRole);

  useEffect(() => {
    setLoading(sessionQuery.isPending);
  }, [sessionQuery.isPending, setLoading]);

  const userId = sessionQuery.data?.user?.id;

  useEffect(() => {
    if (sessionQuery.isPending) return;

    const payload = sessionQuery.data;
    if (!payload?.user) {
      setAuthSession(null, null);
      useAuthStore.setState({ role: null, isBanned: false });
      return;
    }

    setAuthSession(payload.session ?? null, payload.user);
    void fetchRole();
  }, [sessionQuery.isPending, userId, setAuthSession, fetchRole]);

  return <>{children}</>;
}
