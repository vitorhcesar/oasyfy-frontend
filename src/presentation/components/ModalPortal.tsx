import { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renderiza o modal no `document.body` para que `position: fixed` use a
 * viewport. Necessário porque SellerLayout/AdminLayout aplicam
 * `backdrop-filter` no `<main>`, o que cria containing block e prende
 * overlays `fixed` ao painel (sem cobrir a sidebar).
 */
export default function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
