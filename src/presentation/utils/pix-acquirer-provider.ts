export type TPixAcquirerProvider = "woovi" | "onlyup";

export type TOnlyUpCredentialsView = {
  cash_in_client_id: string;
  cash_in_client_secret_masked: string;
  has_cash_in_client_secret: boolean;
  has_cash_in_pfx: boolean;
  has_cash_in_pfx_password: boolean;
  pix_key: string;
  cash_out_client_id?: string;
  cash_out_client_secret_masked?: string;
  has_cash_out_client_secret?: boolean;
  has_cash_out_pfx?: boolean;
  has_cash_out_pfx_password?: boolean;
  cash_out_api_url?: string;
};

export interface IPixAcquirerConnectionLike {
  api_url: string;
  logo_key?: string | null;
  name?: string;
  client_id?: string;
  access_token?: string;
  hmac_key?: string;
  branch_id?: string;
  account_number?: string;
  onlyup?: TOnlyUpCredentialsView | null;
}

export function isRetiredCartwaveAcquirer(
  conn: Pick<IPixAcquirerConnectionLike, "api_url" | "logo_key" | "name">,
): boolean {
  const logoKey = conn.logo_key?.trim().toLowerCase();
  if (logoKey === "cartwave") {
    return true;
  }
  const host = conn.api_url?.trim().toLowerCase() ?? "";
  if (host.includes("cartwave")) {
    return true;
  }
  const name = conn.name?.trim().toLowerCase() ?? "";
  return name.includes("cartwave");
}

export function inferPixAcquirerProvider(
  conn: IPixAcquirerConnectionLike,
): TPixAcquirerProvider {
  const logoKey = conn.logo_key?.trim().toLowerCase();
  if (logoKey === "onlyup") {
    return "onlyup";
  }
  if (logoKey === "woovi" || logoKey === "openpix") {
    return "woovi";
  }

  const host = conn.api_url?.trim().toLowerCase() ?? "";
  if (host.includes("onlyup")) {
    return "onlyup";
  }
  if (host.includes("woovi") || host.includes("openpix")) {
    return "woovi";
  }

  const name = conn.name?.trim().toLowerCase() ?? "";
  if (name.includes("onlyup") || name.includes("only up")) {
    return "onlyup";
  }
  if (name.includes("woovi") || name.includes("openpix")) {
    return "woovi";
  }

  return "woovi";
}

export function getPixAcquirerProviderLabel(provider: TPixAcquirerProvider) {
  if (provider === "onlyup") {
    return "OnlyUp";
  }
  return "Woovi";
}

export function isPixAcquirerProviderSlug(
  slug: string | undefined,
): slug is TPixAcquirerProvider {
  return slug === "woovi" || slug === "onlyup";
}

export function getAcquirerConfigPath(provider: TPixAcquirerProvider) {
  return `/admin/acquirer/${provider}`;
}
