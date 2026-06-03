import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
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
    if (activeTab === "banners") return <BannersTab />;
    if (activeTab === "cores") return <ColorsTab />;

    return (
      <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
          <current.icon size={18} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {current.label}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">
          Em breve esta seção estará disponível.
        </p>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">
            Configurações
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure o gateway da forma que desejar.
          </p>
        </div>

        <div className="border-b border-border/40 mb-8 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium transition-all relative whitespace-nowrap",
                  activeTab === tab.key
                    ? "text-primary"
                    : "text-muted-foreground/60 hover:text-muted-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
}
