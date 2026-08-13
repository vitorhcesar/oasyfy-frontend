import { authClient } from "./auth-client";
import { fetchSessionContext } from "./session-context-api";

export type TEnsureSellerPortalAccessResult =
  | { kind: "ok" }
  | { kind: "error"; message: string }
  | { kind: "needs_verification" };

/**
 * Valida papel seller, banimento implícito no backend e e-mail após `signIn.email`.
 * Mantém paridade entre login direto e fluxo pós-verificação por OTP.
 */
export async function ensureSellerPortalAccess(): Promise<TEnsureSellerPortalAccessResult> {
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
    await authClient.signOut();
    return {
      kind: "error",
      message: "Esta conta é de administrador. Use o login de admin.",
    };
  }

  if (ctx.role !== "seller") {
    await authClient.signOut();
    return {
      kind: "error",
      message: "Esta conta não possui permissão de vendedor.",
    };
  }

  if (!baUser?.emailVerified && !ctx.emailManuallyApproved) {
    // O caller persiste o e-mail e faz signOut em seguida, para o OTP
    // sobreviver caso a tela de login remonte.
    return { kind: "needs_verification" };
  }

  return { kind: "ok" };
}
