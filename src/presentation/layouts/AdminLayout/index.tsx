import { Menu } from "lucide-react";
import { PropsWithChildren, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Canvas atmosphere — conteúdo refrata sob o chrome glass */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute right-[-80px] top-1/3 h-[440px] w-[440px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-100px] left-1/3 h-[480px] w-[480px] rounded-full bg-[#2E0E4F]/40 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full gap-0 md:gap-3 md:p-3">
        <AdminSidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          id="layout-main-scroll"
          className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-y-auto md:rounded-2xl md:border md:border-border/40 md:bg-background/40"
        >
          <div className="flex h-14 items-center border-b border-border/40 bg-card/40 px-4 backdrop-blur-md md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted/40"
            >
              <Menu size={22} />
            </button>
            <span className="ml-2 text-base font-semibold text-foreground">
              OmegaPay
            </span>
          </div>
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
