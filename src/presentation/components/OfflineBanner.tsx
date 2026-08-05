import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-sm text-amber-100 backdrop-blur-md"
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium leading-none">Sem conexão</p>
        <p className="mt-1 text-xs text-amber-100/80">
          Login, API e pagamentos exigem internet. Os dados em tela podem estar
          desatualizados.
        </p>
      </div>
    </div>
  );
}
