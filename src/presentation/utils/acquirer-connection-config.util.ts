import {
  inferPixAcquirerProvider,
  type IPixAcquirerConnectionLike,
  type TPixAcquirerProvider,
} from "./pix-acquirer-provider";

export interface IAcquirerCredentialsForm {
  apiUrl: string;
  clientId: string;
  accessToken: string;
  hmacKey: string;
  branchId: string;
  accountNumber: string;
}

export function isAcquirerConfigured(conn: IPixAcquirerConnectionLike): boolean {
  const provider = inferPixAcquirerProvider(conn);

  if (provider === "woovi") {
    return Boolean(conn.access_token?.trim() && conn.hmac_key?.trim());
  }

  return Boolean(
    conn.client_id?.trim() &&
      conn.access_token?.trim() &&
      conn.hmac_key?.trim() &&
      conn.branch_id?.trim() &&
      conn.account_number?.trim(),
  );
}

export function hasAcquirerCredentialsToSave(
  provider: TPixAcquirerProvider,
  form: IAcquirerCredentialsForm,
): boolean {
  if (provider === "woovi") {
    return Boolean(form.apiUrl.trim() && form.accessToken.trim() && form.hmacKey.trim());
  }

  return Boolean(
    form.apiUrl.trim() &&
      form.clientId.trim() &&
      form.accessToken.trim() &&
      form.hmacKey.trim() &&
      form.branchId.trim() &&
      form.accountNumber.trim(),
  );
}

export function buildAcquirerFormFromConnection(
  conn: IPixAcquirerConnectionLike & {
    access_token?: string;
    client_id?: string;
    hmac_key?: string;
    branch_id?: string;
    account_number?: string;
  },
  configured: boolean,
): IAcquirerCredentialsForm {
  return {
    apiUrl: conn.api_url ?? "",
    clientId: configured ? "" : conn.client_id || "",
    accessToken: configured ? "" : conn.access_token || "",
    hmacKey: configured ? "" : conn.hmac_key || "",
    branchId: configured ? "" : conn.branch_id || "",
    accountNumber: configured ? "" : conn.account_number || "",
  };
}
