/** Formato comum das respostas JSON da API HTTP do backend (`BaseRoute.successResponse`). */
export type ApiEnvelope<T> = {
  status: number;
  message: string;
  data: T;
};
