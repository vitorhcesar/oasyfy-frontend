import { useEffect } from "react";
import { useParams } from "react-router-dom";
import PublicCheckoutPage from "./PublicCheckoutPage";

function getCheckoutBaseUrl(): string | null {
  const fromEnv = import.meta.env.VITE_CHECKOUT_URL as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  return null;
}

/**
 * No host do portal: se VITE_CHECKOUT_URL aponta para outro origin,
 * redireciona /c/:id para o domínio de checkout.
 */
export default function PublicCheckoutEntry() {
  const { publicId = "" } = useParams();
  const checkoutBase = getCheckoutBaseUrl();

  useEffect(() => {
    if (!checkoutBase || !publicId || publicId === "__health") return;
    try {
      const targetOrigin = new URL(checkoutBase).origin;
      if (targetOrigin !== window.location.origin) {
        window.location.replace(`${checkoutBase}/c/${publicId}`);
      }
    } catch {
      // ignore invalid env
    }
  }, [checkoutBase, publicId]);

  if (checkoutBase) {
    try {
      const targetOrigin = new URL(checkoutBase).origin;
      if (targetOrigin !== window.location.origin && publicId !== "__health") {
        return (
          <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-600">
            Redirecionando para o checkout…
          </div>
        );
      }
    } catch {
      // fall through
    }
  }

  return <PublicCheckoutPage />;
}
