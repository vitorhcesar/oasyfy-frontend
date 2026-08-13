import type { ISellerCheckoutDto } from "@/infra/http/services/api/modules/checkout.module";

export function formatCheckoutAmount(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CheckoutPreview({
  title,
  description,
  amountCents,
  logoUrl,
  primaryColor,
  backgroundColor,
  buttonText,
}: {
  title: string;
  description?: string | null;
  amountCents: number;
  logoUrl?: string | null;
  primaryColor: string;
  backgroundColor: string;
  buttonText: string;
}) {
  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border/60 p-6"
      style={{ backgroundColor }}
    >
      <div className="w-full max-w-sm space-y-5 text-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="mx-auto h-14 w-auto object-contain"
          />
        ) : (
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {(title || "C").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
            {title || "Título do checkout"}
          </h3>
          {description ? (
            <p className="text-sm text-zinc-600">{description}</p>
          ) : null}
        </div>
        <p
          className="text-3xl font-semibold tracking-tight"
          style={{ color: primaryColor }}
        >
          {formatCheckoutAmount(amountCents || 0)}
        </p>
        <button
          type="button"
          className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {buttonText || "Pagar com PIX"}
        </button>
        <p className="text-[11px] text-zinc-500">Pagamento processado por Oasyfy</p>
      </div>
    </div>
  );
}

export const CHECKOUT_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  expired: "Expirado",
  archived: "Arquivado",
  exhausted: "Esgotado",
};

export type TCheckoutFormState = Pick<
  ISellerCheckoutDto,
  | "title"
  | "description"
  | "amount"
  | "logoUrl"
  | "primaryColor"
  | "backgroundColor"
  | "buttonText"
  | "successMessage"
  | "customerDocumentRequired"
  | "maxPayments"
>;
