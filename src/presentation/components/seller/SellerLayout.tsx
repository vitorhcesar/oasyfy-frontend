import { OfflineBanner } from "@/presentation/components/OfflineBanner";
import { PropsWithChildren, useState } from "react";
import { SellerSidebar } from "./SellerSidebar";
import { SellerTopbar } from "./SellerTopbar";

export function SellerLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      <div aria-hidden className="layout-atmosphere pointer-events-none fixed inset-0 z-0">
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex h-full w-full gap-0 md:gap-3 md:p-3">
        <SellerSidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          id="layout-main-scroll"
          className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-y-auto md:rounded-[22px] md:border md:border-white/10 md:bg-background/55 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:backdrop-blur-2xl md:backdrop-saturate-150"
        >
          <OfflineBanner />
          <SellerTopbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
