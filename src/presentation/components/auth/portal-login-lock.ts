/**
 * Flag síncrona (não é estado React) para o PublicRoute não desmontar o
 * formulário de login no meio do gate de papel. Deve ser setada para true
 * ANTES do primeiro await do submit.
 */
let inFlight = false;

export function setLoginInFlight(value: boolean) {
  inFlight = value;
}

export function isLoginInFlight(): boolean {
  return inFlight;
}
