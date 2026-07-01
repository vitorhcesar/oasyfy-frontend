export interface INormalizedPixChargeResponse {
  error?: string;
  pixCode: string;
  qrCodeImage: string;
  acquirer?: string;
  provider?: string;
  failoverAttempts?: number;
  raw: Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizePixChargeResponse(
  data: unknown,
): INormalizedPixChargeResponse {
  const root = readRecord(data) ?? {};
  const wooviCharge = readRecord(root.woovi_charge);
  const charge = readRecord(root.charge) ?? wooviCharge;
  const qrCode = readRecord(root.qr_code);
  const routing = readRecord(root._routing);

  const pixCode =
    readString(root.pix_copy_and_paste) ||
    readString(root.pix_copy_paste) ||
    readString(root.copy_and_paste) ||
    readString(charge?.brCode) ||
    readString(wooviCharge?.brCode) ||
    readString(qrCode?.emv) ||
    readString(root.emv) ||
    readString(root.brcode) ||
    readString(root.brCode);

  const qrCodeImage =
    readString(charge?.qrCodeImage) ||
    readString(wooviCharge?.qrCodeImage) ||
    readString(qrCode?.base64) ||
    readString(root.base_64_image);

  const error = readString(root.error) || undefined;

  return {
    error,
    pixCode,
    qrCodeImage,
    acquirer: readString(routing?.acquirer) || undefined,
    provider: readString(routing?.provider) || undefined,
    failoverAttempts:
      typeof routing?.failover_attempts === "number"
        ? routing.failover_attempts
        : undefined,
    raw: root,
  };
}
