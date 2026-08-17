import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { OfflineBanner } from "@/presentation/components/OfflineBanner";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { Menu } from "lucide-react";
import { PropsWithChildren, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useThemeContext();
  const logoVariant = theme === "dark" ? "white" : "black";

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
      {/* Canvas atmosphere — refrata sob o chrome Liquid Glass */}
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
        <AdminSidebar
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          id="layout-main-scroll"
          className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-hidden md:rounded-[22px] md:border md:border-white/10 md:bg-background/55 md:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:backdrop-blur-2xl md:backdrop-saturate-150"
        >
          <OfflineBanner />
          <div className="sticky top-0 z-30 shrink-0 bg-background px-3 pb-2 pt-3 md:hidden">
            <header className="flex h-12 min-h-12 items-center justify-between rounded-full border border-border bg-card py-1 pl-1.5 pr-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/10"
              >
                <Menu size={20} />
              </button>
              <AuthBrandMark
                mark="icon"
                size="sm"
                variant={logoVariant}
              />
            </header>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
