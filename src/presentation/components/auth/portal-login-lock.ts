/**
 * Flag síncrona (não é estado React) para o PublicRoute não desmontar o
 * formulário de login no meio do gate de papel. Deve ser setada para true
 * ANTES do primeiro await do submit.
 */
export type TPortalLogin = "admin" | "seller";

const inFlight: Record<TPortalLogin, boolean> = {
  admin: false,
  seller: false,
};

export function setPortalLoginInFlight(portal: TPortalLogin, value: boolean) {
  inFlight[portal] = value;
}

export function isPortalLoginInFlight(portal: TPortalLogin): boolean {
  return inFlight[portal];
}
