import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { BannersTab } from "@/presentation/pages/AdminGeneralPage/components/BannersTab";
import { ColorsTab } from "@/presentation/pages/AdminGeneralPage/components/ColorsTab";
import { cn } from "@/presentation/utils/cn";
import { Building2, Image, LayoutGrid, Palette } from "lucide-react";
import { useState } from "react";

const tabs = [
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "imagens", label: "Imagens", icon: Image },
  { key: "cores", label: "Cores", icon: Palette },
  { key: "banners", label: "Banners", icon: LayoutGrid },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AdminGeneralPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("empresa");
  const current = tabs.find((t) => t.key === activeTab)!;

  const renderContent = () => {
    switch (activeTab) {
      case "banners":
        return <BannersTab />;
      case "cores":
        return <ColorsTab />;
      default:
        return (
          <div className="admin-surface px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <current.icon size={18} className="text-primary" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground">
              {current.label}
            </p>
            <p className="text-sm text-muted-foreground">
              Em breve esta seção estará disponível.
            </p>
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 animate-fade-in">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Sistema
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
            Geral
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Configure o gateway da forma que desejar.
          </p>
        </header>

        <div className="liquid-glass-control mb-8 flex flex-wrap items-center gap-0.5 rounded-2xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                activeTab === tab.key
                  ? "bg-white text-[#0F0617] shadow-sm"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
}
