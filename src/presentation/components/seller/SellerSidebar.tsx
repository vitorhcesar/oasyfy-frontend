import { supabase } from "@/infra/integrations/supabase/client";
import { NavLink } from "@/presentation/components/NavLink";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Blocks,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Home,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ISellerSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function SellerSidebar({ mobileOpen, onClose }: ISellerSidebarProps) {
  const navigate = useNavigate();

  const location = useLocation();
  const isOnSettingsPage =
    location.pathname.startsWith("/seller/settings") ||
    location.pathname.startsWith("/seller/kyc") ||
    location.pathname.startsWith("/seller/2fa");

  const { user, signOut } = useAuthStore();

  const [collapsed, setCollapsed] = useState(false);
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(isOnSettingsPage);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("kyc_submissions")
      .select("status, documents_status, bank_status, address_status")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setKycApproved(
            data[0].status === "approved" &&
              data[0].documents_status === "approved" &&
              data[0].bank_status === "approved" &&
              data[0].address_status === "approved"
          );
        } else {
          setKycApproved(false);
        }
      });
  }, [user]);

  useEffect(() => {
    if (isOnSettingsPage) setSettingsOpen(true);
  }, [isOnSettingsPage]);

  useEffect(() => {
    if (mobileOpen && onClose) onClose();
  }, [location.pathname]);

  const mainItems = [
    { title: "Início", url: "/seller", icon: Home, locked: !kycApproved },
    {
      title: "Transações",
      url: "/seller/transactions",
      icon: ArrowLeftRight,
      locked: !kycApproved,
    },
  ];

  const financeItems = [
    {
      title: "Depósito",
      url: "/seller/deposit",
      icon: ArrowDownLeft,
      locked: !kycApproved,
    },
    {
      title: "Saques",
      url: "/seller/transfers",
      icon: ArrowUpRight,
      locked: !kycApproved,
    },
  ];

  const settingsSubItems = [
    {
      title: "Perfil",
      url: "/seller/settings",
      icon: User,
      locked: !kycApproved,
    },
    { title: "Documentos", url: "/seller/kyc", icon: FileText, locked: false },
    { title: "2FA", url: "/seller/2fa", icon: ShieldCheck, locked: false },
  ];

  const devItems = [
    { title: "API", url: "/seller/api", icon: Code2 },
    { title: "integração  ", url: "/seller/apps", icon: Blocks },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login/seller");
  };

  const renderItem = (
    item: { title: string; url: string; icon: any; locked?: boolean },
    isCollapsed: boolean,
    small = false
  ) => {
    const iconSize = small ? 16 : 18;
    const textSize = small ? "text-[13px]" : "text-sm";
    const py = small ? "py-2" : "py-2.5";

    if (item.locked) {
      return (
        <div
          key={item.url}
          className={cn(
            `flex items-center gap-3 px-3 ${py} rounded-lg ${textSize} text-muted-foreground/25 cursor-not-allowed select-none`,
            isCollapsed && "justify-center px-2"
          )}
          title="Disponível após aprovação do KYC"
        >
          <item.icon size={iconSize} strokeWidth={1.7} className="shrink-0" />
          {!isCollapsed && <span className="flex-1">{item.title}</span>}
          {!isCollapsed && <Lock size={10} className="shrink-0 opacity-40" />}
        </div>
      );
    }

    return (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.url === "/seller"}
        className={cn(
          `flex items-center gap-3 px-3 ${py} rounded-lg ${textSize} text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-all duration-150`,
          isCollapsed && "justify-center px-2"
        )}
        activeClassName="bg-primary/10 text-primary font-medium"
      >
        <item.icon size={iconSize} strokeWidth={1.7} className="shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </NavLink>
    );
  };

  const SectionLabel = ({
    children,
    collapsed: isCollapsed,
  }: {
    children: string;
    collapsed: boolean;
  }) => {
    if (isCollapsed)
      return <div className="my-3 mx-2 border-t border-border/20" />;
    return (
      <p className="px-3 mb-1.5 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
        {children}
      </p>
    );
  };

  const sidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-border/20",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {isCollapsed ? (
            <span className="text-lg font-bold text-primary">O</span>
          ) : (
            <span className="text-lg font-bold tracking-tight text-foreground">
              Oasyfy
            </span>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
          {/* Main */}
          <SectionLabel collapsed={isCollapsed}>Geral</SectionLabel>
          <div className="space-y-0.5">
            {mainItems.map((item) => renderItem(item, isCollapsed))}
          </div>

          {/* Finance */}
          <SectionLabel collapsed={isCollapsed}>Financeiro</SectionLabel>
          <div className="space-y-0.5">
            {financeItems.map((item) => renderItem(item, isCollapsed))}
          </div>

          {/* Settings */}
          <SectionLabel collapsed={isCollapsed}>Conta</SectionLabel>
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-all duration-150"
              >
                <Settings size={18} strokeWidth={1.7} className="shrink-0" />
                <span className="flex-1 text-left">Configurações</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-muted-foreground/40 transition-transform duration-200",
                    settingsOpen && "rotate-180"
                  )}
                />
              </button>
              {settingsOpen && (
                <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-primary/15 pl-3">
                  {settingsSubItems.map((item) =>
                    renderItem(item, false, true)
                  )}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/seller/settings"
              className="flex items-center justify-center px-2 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-all duration-150"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <Settings size={18} strokeWidth={1.7} className="shrink-0" />
            </NavLink>
          )}

          {/* Developer */}
          <SectionLabel collapsed={isCollapsed}>Developer</SectionLabel>
          <div className="space-y-0.5">
            {devItems.map((item) => renderItem(item, isCollapsed))}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-border/20 p-2.5 space-y-1")}>
          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive/70 hover:bg-destructive/5 hover:text-destructive transition-all duration-150",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut size={18} strokeWidth={1.7} />
            {!isCollapsed && <span>Sair</span>}
          </button>

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/20 transition-all duration-150",
                isCollapsed && "justify-center px-2"
              )}
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
              {!isCollapsed && <span>Recolher menu</span>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen sticky top-0 flex-col bg-card/60 backdrop-blur-md border-r border-border/20 transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 flex flex-col bg-card border-r border-border/20 z-50 md:hidden animate-in slide-in-from-left duration-200">
            {sidebarContent(true)}
          </aside>
        </>
      )}
    </>
  );
}
