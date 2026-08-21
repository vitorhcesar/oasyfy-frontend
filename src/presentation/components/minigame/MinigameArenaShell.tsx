import { OfflineBanner } from "@/presentation/components/OfflineBanner";
import type { ReactNode } from "react";

export function MinigameArenaShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      <div
        aria-hidden
        className="layout-atmosphere pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute -left-28 -top-32 h-[560px] w-[560px] rounded-full bg-primary/40 blur-[150px]" />
        <div className="absolute right-[-120px] top-[18%] h-[480px] w-[480px] rounded-full bg-primary/30 blur-[130px]" />
        <div className="absolute bottom-[-140px] left-[28%] h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute left-[45%] top-[42%] h-[280px] w-[280px] rounded-full bg-primary/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
      <div className="relative z-10 flex h-full min-h-0 w-full flex-col">
        <OfflineBanner />
        {children}
      </div>
    </div>
  );
}
