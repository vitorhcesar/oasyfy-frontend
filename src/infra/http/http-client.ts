import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import { apiAxios } from "./axios-instance";

/**
 * Cliente HTTP fino sobre Axios: devolve `response.data` tipado para uso por camadas internas (repositórios).
 */
export class HttpClient {
  constructor(private readonly client: AxiosInstance = apiAxios) {}

  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const { data } = await this.client.get<T>(url, config);
    return data;
  }

  async post<T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const { data } = await this.client.post<T>(url, body, config);
    return data;
  }

  async put<T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const { data } = await this.client.put<T>(url, body, config);
    return data;
  }

  async patch<T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const { data } = await this.client.patch<T>(url, body, config);
    return data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.delete<T>(url, config);
    return data;
  }

  /**
   * Acesso bruto ao Axios quando precisar de `AxiosResponse` completa, stream, ou config avançada.
   */
  rawRequest<T = unknown>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }
}

export const httpClient = new HttpClient();
