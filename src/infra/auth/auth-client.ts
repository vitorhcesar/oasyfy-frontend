import { createAuthClient } from "better-auth/react";
import { getApiBaseUrl } from "../http/api-env";

/**
 * Cliente Better Auth para React (`baseURL` + `/api/auth`).
 * Cookies de sessão: use `credentials: 'include'` (API em outra origem ou proxy).
 *
 * @see https://www.better-auth.com/docs/concepts/client
 */
export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
});
