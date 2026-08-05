import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

function shouldRegisterServiceWorker(): boolean {
  if (!import.meta.env.PROD) return false;

  const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL;
  if (!checkoutUrl) return true;

  try {
    const checkoutHost = new URL(checkoutUrl).hostname;
    return window.location.hostname !== checkoutHost;
  } catch {
    return true;
  }
}

if (shouldRegisterServiceWorker()) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")!).render(<App />);
