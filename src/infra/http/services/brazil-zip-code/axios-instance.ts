import axios, { type AxiosInstance } from "axios";
import { getBrazilZipCodeBaseUrl } from "./api-env";

/**
 * Instância Axios configurada para o serviço de busca de endereço por CEP.
 */
export const brazilZipCodeAxios: AxiosInstance = axios.create({
  baseURL: getBrazilZipCodeBaseUrl(),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
