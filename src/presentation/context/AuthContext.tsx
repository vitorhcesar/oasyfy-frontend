import { authClient } from "@/infra/auth/auth-client";
import { fetchSessionContext } from "@/infra/auth/session-context-api";
import {
  isSameSessionIdentity,
  isSameUserIdentity,
  useStableValue,
} from "@/presentation/context/auth-session-identity";
import { isAuthSessionLoading } from "@/presentation/context/auth-session-loading";
import type { Session, User } from "better-auth/types";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TAppRole = "admin" | "seller";

export interface IAuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  role: TAppRole | null;
  isBanned: boolean;
  apiAccessEnabled: boolean;
  pracaAccessEnabled: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthContextProvider({ children }: PropsWithChildren) {
  const sessionQuery = authClient.useSession();

  const [role, setRole] = useState<TAppRole | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [apiAccessEnabled, setApiAccessEnabled] = useState(false);
  const [pracaAccessEnabled, setPracaAccessEnabled] = useState(false);
  /**
   * userId para o qual GET /session/context já terminou (sucesso ou falha).
   * Comparar com o userId atual evita o frame em que a sessão hidrata
   * e o papel ainda é o estado residual — o flash da tela de login.
   */
  const [roleResolvedForUserId, setRoleResolvedForUserId] = useState<
    string | null
  >(null);
  const sessionHasResolvedRef = useRef(false);

  const rawUser = sessionQuery.data?.user ?? null;
  const rawSession = (sessionQuery.data?.session as Session) ?? null;
  const user = useStableValue(rawUser, isSameUserIdentity);
  const session = useStableValue(rawSession, isSameSessionIdentity);
  const userId = user?.id;

  if (!sessionQuery.isPending) {
    sessionHasResolvedRef.current = true;
  }

  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const roleRequestIdRef = useRef(0);

  const fetchRole = useCallback(async () => {
    const forUserId = userIdRef.current;
    if (!forUserId) return;

    const requestId = ++roleRequestIdRef.current;
    try {
      const ctx = await fetchSessionContext();
      if (
        roleRequestIdRef.current !== requestId ||
        userIdRef.current !== forUserId
      ) {
        return;
      }
      setRole(ctx.role);
      setIsBanned(ctx.isBanned);
      setApiAccessEnabled(ctx.apiAccessEnabled ?? false);
      setPracaAccessEnabled(ctx.pracaAccessEnabled ?? false);
      setRoleResolvedForUserId(forUserId);
    } catch {
      if (
        roleRequestIdRef.current !== requestId ||
        userIdRef.current !== forUserId
      ) {
        return;
      }
      setRole(null);
      setIsBanned(false);
      setApiAccessEnabled(false);
      setPracaAccessEnabled(false);
      setRoleResolvedForUserId(forUserId);
    }
  }, []);

  const resetRoleState = useCallback(() => {
    roleRequestIdRef.current += 1;
    setRole(null);
    setIsBanned(false);
    setApiAccessEnabled(false);
    setPracaAccessEnabled(false);
    setRoleResolvedForUserId(null);
  }, []);

  useEffect(() => {
    if (sessionQuery.isPending || sessionQuery.isRefetching) return;

    if (!userId) {
      resetRoleState();
      return;
    }

    if (roleResolvedForUserId === userId) return;

    void fetchRole();
  }, [
    sessionQuery.isPending,
    sessionQuery.isRefetching,
    userId,
    roleResolvedForUserId,
    fetchRole,
    resetRoleState,
  ]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    resetRoleState();
  }, [resetRoleState]);

  const isLoading = isAuthSessionLoading(
    sessionQuery.isPending,
    userId,
    roleResolvedForUserId,
    sessionHasResolvedRef.current,
  );

  const value = useMemo<IAuthContext>(
    () => ({
      isAuthenticated: !!user,
      isLoading,
      user,
      session,
      role,
      isBanned,
      apiAccessEnabled,
      pracaAccessEnabled,
      signOut,
    }),
    [user, isLoading, session, role, isBanned, apiAccessEnabled, pracaAccessEnabled, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): IAuthContext {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext deve ser usado dentro de AuthContextProvider");
  }
  return ctx;
}
