import axios, { type AxiosInstance } from "axios";

import { getApiBaseUrl } from "./api-env";

/**
 * Instância Axios configurada para o backend Oasyfy.
 * Use nos repositórios/casos de uso via {@link HttpClient} para manter a borda da aplicação na infraestrutura.
 */
export const apiAxios: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 60_000,
});

// Encaixe futuro: ler token de sessão e definir Authorization aqui.
