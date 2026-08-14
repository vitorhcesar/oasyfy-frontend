/**
 * Sessão ainda não é segura para renderizar login ou área autenticada.
 * Evita o flash da tela de login no reload: o papel precisa ter sido
 * resolvido para o mesmo userId da sessão atual.
 */
export function isAuthSessionLoading(
  sessionPending: boolean,
  userId: string | null | undefined,
  roleResolvedForUserId: string | null,
): boolean {
  return sessionPending || (!!userId && roleResolvedForUserId !== userId);
}
