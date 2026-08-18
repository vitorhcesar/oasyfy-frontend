/**
 * Resolve the QR image to show on PIX screens.
 * Woovi may return an image; OnlyUp only returns the EMV string.
 */
export function resolvePixQrCodeSrc(input: {
  qrCodeImage?: string | null;
  pixCode?: string | null;
  size?: number;
}): string {
  const image = input.qrCodeImage?.trim() ?? "";
  if (image) {
    if (image.startsWith("data:") || image.startsWith("http")) {
      return image;
    }
    return `data:image/png;base64,${image}`;
  }

  const pixCode = input.pixCode?.trim() ?? "";
  if (!pixCode) {
    return "";
  }

  const size = input.size && input.size > 0 ? input.size : 260;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(pixCode)}`;
}
