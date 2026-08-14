/**
 * Sessão ainda não é segura para renderizar login ou área autenticada.
 * Evita o flash da tela de login no reload: o papel precisa ter sido
 * resolvido para o mesmo userId da sessão atual.
 *
 * `sessionHasResolved` distingue o boot inicial de um refetch. O Better Auth
 * marca `isPending=true` em todo get-session enquanto `data === null` — o que
 * inclui refetch ao focar a aba quando o usuário não está logado.
 */
export function isAuthSessionLoading(
  sessionPending: boolean,
  userId: string | null | undefined,
  roleResolvedForUserId: string | null,
  sessionHasResolved = false,
): boolean {
  const waitingForInitialSession = sessionPending && !sessionHasResolved;
  const waitingForRole = !!userId && roleResolvedForUserId !== userId;
  return waitingForInitialSession || waitingForRole;
}
