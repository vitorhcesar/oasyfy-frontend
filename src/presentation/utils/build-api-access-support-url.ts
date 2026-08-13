/**
 * Monta o link de suporte (WhatsApp) com mensagem pedindo liberação da API.
 * Configure `VITE_SUPPORT_WHATSAPP_URL` (ex.: https://wa.me/5511999999999).
 */
export function buildApiAccessSupportUrl(input: {
  accountId?: string | null;
  email?: string | null;
}): string | null {
  const base = import.meta.env.VITE_SUPPORT_WHATSAPP_URL?.trim();
  if (!base) return null;

  const lines = [
    "Olá! Gostaria de solicitar a liberação da API Oasyfy.",
    input.accountId ? `Conta: ${input.accountId}` : null,
    input.email ? `E-mail: ${input.email}` : null,
  ].filter(Boolean);

  const text = lines.join("\n");
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}text=${encodeURIComponent(text)}`;
}
