export type TPixAcquirerProvider = "cartwave" | "woovi";

export interface IPixAcquirerConnectionLike {
  api_url: string;
  logo_key?: string | null;
  name?: string;
  client_id?: string;
  access_token?: string;
  hmac_key?: string;
  branch_id?: string;
  account_number?: string;
}

export function inferPixAcquirerProvider(
  conn: IPixAcquirerConnectionLike,
): TPixAcquirerProvider {
  const logoKey = conn.logo_key?.trim().toLowerCase();
  if (logoKey === "woovi" || logoKey === "openpix") {
    return "woovi";
  }
  if (logoKey === "cartwave") {
    return "cartwave";
  }

  const host = conn.api_url?.trim().toLowerCase() ?? "";
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
  if (name.includes("cartwave")) {
    return "cartwave";
  }
  if (name.includes("woovi") || name.includes("openpix")) {
    return "woovi";
  }

  return "woovi";
}

export function getPixAcquirerProviderLabel(provider: TPixAcquirerProvider) {
  return provider === "woovi" ? "Woovi" : "Cartwave";
}
