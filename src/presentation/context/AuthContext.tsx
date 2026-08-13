import { authClient } from "@/infra/auth/auth-client";
import { fetchSessionContext } from "@/infra/auth/session-context-api";
import type { Session, User } from "better-auth/types";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthContextProvider({ children }: PropsWithChildren) {
  const sessionQuery = authClient.useSession();

  const [role, setRole] = useState<TAppRole | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [apiAccessEnabled, setApiAccessEnabled] = useState(false);
  /**
   * true enquanto o GET /session/context está em voo.
   * Usado para manter isLoading = true durante a busca de role.
   */
  const [roleFetching, setRoleFetching] = useState(false);
  /**
   * true depois que a primeira busca de role foi concluída (sucesso ou falha).
   * Garante que isLoading permaneça true até sabermos o papel do usuário.
   */
  const [roleFetched, setRoleFetched] = useState(false);

  const user = sessionQuery.data?.user ?? null;
  const session = (sessionQuery.data?.session as Session) ?? null;
  const userId = user?.id;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const roleRequestIdRef = useRef(0);

  const fetchRole = useCallback(async () => {
    const forUserId = userIdRef.current;
    if (!forUserId) return;

    const requestId = ++roleRequestIdRef.current;
    setRoleFetching(true);
    setRoleFetched(false);
    try {
      const ctx = await fetchSessionContext();
      if (roleRequestIdRef.current !== requestId || userIdRef.current !== forUserId) {
        return;
      }
      setRole(ctx.role);
      setIsBanned(ctx.isBanned);
      setApiAccessEnabled(ctx.apiAccessEnabled ?? false);
    } catch {
      if (roleRequestIdRef.current !== requestId || userIdRef.current !== forUserId) {
        return;
      }
      setRole(null);
      setIsBanned(false);
      setApiAccessEnabled(false);
    } finally {
      if (roleRequestIdRef.current === requestId && userIdRef.current === forUserId) {
        setRoleFetching(false);
        setRoleFetched(true);
      }
    }
  }, []);

  const resetRoleState = useCallback(() => {
    roleRequestIdRef.current += 1;
    setRole(null);
    setIsBanned(false);
    setApiAccessEnabled(false);
    setRoleFetching(false);
    setRoleFetched(true);
  }, []);

  useEffect(() => {
    if (!userId) {
      resetRoleState();
      return;
    }

    if (sessionQuery.isPending) return;

    void fetchRole();
  }, [sessionQuery.isPending, userId, fetchRole, resetRoleState]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    resetRoleState();
  }, [resetRoleState]);

  // Está carregando enquanto a sessão do Better Auth não resolveu
  // OU enquanto o usuário existe mas o papel ainda não foi buscado.
  const isLoading =
    sessionQuery.isPending || (!!userId && (!roleFetched || roleFetching));

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        session,
        role,
        isBanned,
        apiAccessEnabled,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): IAuthContext {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext deve ser usado dentro de AuthContextProvider");
  }
  return ctx;
}
