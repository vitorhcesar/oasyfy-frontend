export function parseSecretFromTotpUri(totpUri: string): string {
  try {
    return new URL(totpUri).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

export function isTwoFactorRedirect(
  data: unknown,
): data is { twoFactorRedirect: true; twoFactorMethods?: string[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    "twoFactorRedirect" in data &&
    (data as { twoFactorRedirect?: boolean }).twoFactorRedirect === true
  );
}
