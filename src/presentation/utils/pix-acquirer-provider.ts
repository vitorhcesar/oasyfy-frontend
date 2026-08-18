export type TPixAcquirerProvider = "cartwave" | "woovi" | "onlyup";

export type TOnlyUpCredentialsView = {
  cash_in_client_id: string;
  cash_in_client_secret_masked: string;
  has_cash_in_client_secret: boolean;
  has_cash_in_pfx: boolean;
  has_cash_in_pfx_password: boolean;
  pix_key: string;
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
  if (logoKey === "cartwave") {
    return "cartwave";
  }

  const host = conn.api_url?.trim().toLowerCase() ?? "";
  if (host.includes("onlyup")) {
    return "onlyup";
  }
  if (host.includes("woovi") || host.includes("openpix")) {
    return "woovi";
  }

  const hasCartwaveAccount =
    Boolean(conn.branch_id?.trim()) && Boolean(conn.account_number?.trim());
  const hasCartwaveHmac = Boolean(conn.hmac_key?.trim());
  if (hasCartwaveAccount && hasCartwaveHmac) {
    return "cartwave";
  }

  const name = conn.name?.trim().toLowerCase() ?? "";
  if (name.includes("onlyup") || name.includes("only up")) {
    return "onlyup";
  }
  if (name.includes("cartwave")) {
    return "cartwave";
  }
  if (name.includes("woovi") || name.includes("openpix")) {
    return "woovi";
  }

  return "woovi";
}

export function getPixAcquirerProviderLabel(provider: TPixAcquirerProvider) {
  if (provider === "woovi") {
    return "Woovi";
  }
  if (provider === "onlyup") {
    return "OnlyUp";
  }
  return "Cartwave";
}

export function isPixAcquirerProviderSlug(
  slug: string | undefined,
): slug is TPixAcquirerProvider {
  return slug === "woovi" || slug === "cartwave" || slug === "onlyup";
}

export function getAcquirerConfigPath(provider: TPixAcquirerProvider) {
  return `/admin/acquirer/${provider}`;
}
