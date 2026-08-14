import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { getApiBaseUrl } from "../http/services/api/api-env";

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
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        // Fluxo tratado inline nos formulários de login.
      },
    }),
  ],
});
