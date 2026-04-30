/** Formato comum das respostas JSON da API HTTP do backend (`BaseRoute.successResponse`). */
export interface IApiEnvelope<T> {
  status: number;
  message: string;
  data: T;
}
