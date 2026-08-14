import { authClient } from "./auth-client";
import { fetchSessionContext } from "./session-context-api";

export type TResolvePortalLoginResult =
  | { kind: "admin" }
  | { kind: "seller" }
  | { kind: "error"; message: string }
  | { kind: "needs_verification" };

/**
 * Após `signIn.email` (ou 2FA), decide o destino: admin, seller,
 * verificação de e-mail ou erro. Não desloga admin.
 */
export async function resolvePortalLogin(): Promise<TResolvePortalLoginResult> {
  const session = await authClient.getSession();
  const baUser = session.data?.user;

  let ctx;
  try {
    ctx = await fetchSessionContext();
  } catch {
    await authClient.signOut();
    return {
      kind: "error",
      message: "Não foi possível validar permissões da conta.",
    };
  }

  if (ctx.role === "admin") {
    return { kind: "admin" };
  }

  if (ctx.role !== "seller") {
    await authClient.signOut();
    return {
      kind: "error",
      message: "Esta conta não possui permissão de acesso.",
    };
  }

  if (!baUser?.emailVerified && !ctx.emailManuallyApproved) {
    return { kind: "needs_verification" };
  }

  return { kind: "seller" };
}
