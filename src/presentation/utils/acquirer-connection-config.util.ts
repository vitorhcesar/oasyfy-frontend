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
  cashInClientSecret: string;
  cashInPfx: string;
  cashInPfxPassword: string;
  pixKey: string;
}

export function isAcquirerConfigured(conn: IPixAcquirerConnectionLike): boolean {
  const provider = inferPixAcquirerProvider(conn);

  if (provider === "woovi") {
    return Boolean(conn.access_token?.trim() && conn.hmac_key?.trim());
  }

  if (provider === "onlyup") {
    const onlyup = conn.onlyup;
    return Boolean(
      onlyup?.has_cash_in_client_secret &&
        onlyup.has_cash_in_pfx &&
        onlyup.has_cash_in_pfx_password &&
        onlyup.pix_key?.trim() &&
        (onlyup.cash_in_client_id?.trim() || conn.client_id?.trim()),
    );
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
  configured = false,
): boolean {
  if (provider === "woovi") {
    return Boolean(form.apiUrl.trim() && form.accessToken.trim() && form.hmacKey.trim());
  }

  if (provider === "onlyup") {
    return Boolean(
      form.apiUrl.trim() &&
        form.clientId.trim() &&
        form.pixKey.trim() &&
        (form.cashInClientSecret.trim() || configured) &&
        (form.cashInPfx.trim() || configured) &&
        (form.cashInPfxPassword.trim() || configured),
    );
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
  const onlyup = conn.onlyup;
  return {
    apiUrl: conn.api_url ?? "",
    clientId: configured
      ? onlyup?.cash_in_client_id || conn.client_id || ""
      : conn.client_id || onlyup?.cash_in_client_id || "",
    accessToken: configured ? "" : conn.access_token || "",
    hmacKey: configured ? "" : conn.hmac_key || "",
    branchId: configured ? "" : conn.branch_id || "",
    accountNumber: configured ? "" : conn.account_number || "",
    cashInClientSecret: "",
    cashInPfx: "",
    cashInPfxPassword: "",
    pixKey: onlyup?.pix_key || "",
  };
}
