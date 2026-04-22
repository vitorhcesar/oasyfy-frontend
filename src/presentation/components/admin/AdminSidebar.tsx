import { NavLink } from "@/presentation/components/NavLink";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { useAuthStore } from "@/presentation/stores/useAuthStore";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sliders,
  Sun,
  Target,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtores", url: "/admin/kyc", icon: FileCheck },
];

const financialSubItems = [
  { title: "Vendas", url: "/admin/transactions", icon: Receipt },
  { title: "Saques", url: "/admin/withdrawals", icon: ArrowLeftRight },
  { title: "Metas", url: "/admin/goals", icon: Target },
  { title: "Reembolsos", url: "/admin/refunds", icon: RotateCcw },
];

const settingsSubItems = [
  { title: "Geral", url: "/admin/general", icon: Sliders },
  { title: "Adquirente", url: "/admin/acquirer", icon: CreditCard },
  { title: "Taxas globais", url: "/admin/global-fees", icon: DollarSign },
  { title: "E-mail", url: "/admin/email", icon: Mail },
  {
    title: "CRM",
    url: "/admin/crm",
    icon: ({ size = 16, className }: { size?: number; className?: string }) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  { title: "2FA", url: "/admin/2fa", icon: ShieldCheck },
  { title: "Administradores", url: "/admin/managers", icon: UserCog },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const { user, signOut } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeContext();
  const name = user?.user_metadata?.full_name || user?.email || "Admin";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isOnSettings =
    location.pathname.startsWith("/admin/general") ||
    location.pathname.startsWith("/admin/acquirer") ||
    location.pathname.startsWith("/admin/global-fees") ||
    location.pathname.startsWith("/admin/email") ||
    location.pathname.startsWith("/admin/crm") ||
    location.pathname.startsWith("/admin/2fa") ||
    location.pathname.startsWith("/admin/managers");
  const isOnFinancial = financialSubItems.some((i) =>
    location.pathname.startsWith(i.url)
  );
  const [settingsOpen, setSettingsOpen] = useState(isOnSettings);
  const [financialOpen, setFinancialOpen] = useState(isOnFinancial);

  // Close mobile drawer on navigation
  useEffect(() => {
    if (mobileOpen && onClose) onClose();
    // eslint-disable-next-line
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login/admin");
  };

  const linkClass = `flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200`;
  const activeClass = "bg-primary/10 text-primary font-semibold";

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div
        className={`h-16 flex items-center justify-between ${
          collapsed ? "justify-center px-2" : "px-5"
        } border-b border-border`}
      >
        <span className="text-lg font-bold text-foreground">Oasyfy</span>
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-3 text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Menu
          </p>
        )}
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className={`${linkClass} ${collapsed ? "justify-center" : ""}`}
            activeClassName={activeClass}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}

        {/* Financial section */}
        {!collapsed && (
          <div className="mt-4">
            <button
              onClick={() => setFinancialOpen(!financialOpen)}
              className={cn(
                linkClass,
                "w-full",
                isOnFinancial && "text-primary"
              )}
            >
              <CreditCard size={20} className="flex-shrink-0" />
              <span className="flex-1 text-left">Financeiro</span>
              <ChevronDown
                size={14}
                className={cn(
                  "flex-shrink-0 text-muted-foreground/40 transition-transform duration-200",
                  financialOpen && "rotate-180"
                )}
              />
            </button>
            {financialOpen && (
              <div className="ml-6 mt-1 space-y-0.5 border-l border-border/20 pl-3">
                {financialSubItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end
                    className={`${linkClass} text-[13px] py-2.5`}
                    activeClassName={activeClass}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
        {collapsed && (
          <NavLink
            to="/admin/transactions"
            className={`${linkClass} justify-center mt-2`}
            activeClassName={activeClass}
          >
            <CreditCard size={20} className="flex-shrink-0" />
          </NavLink>
        )}

        {/* Settings section */}
        {!collapsed && (
          <div className="mt-4">
            <p className="px-3 mb-2 text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Sistema
            </p>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={cn(
                linkClass,
                "w-full",
                isOnSettings && "text-primary"
              )}
            >
              <Settings size={20} className="flex-shrink-0" />
              <span className="flex-1 text-left">Configurações</span>
              <ChevronDown
                size={14}
                className={cn(
                  "flex-shrink-0 text-muted-foreground/40 transition-transform duration-200",
                  settingsOpen && "rotate-180"
                )}
              />
            </button>
            {settingsOpen && (
              <div className="ml-6 mt-1 space-y-0.5 border-l border-border/20 pl-3">
                {settingsSubItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end
                    className={`${linkClass} text-[13px] py-2.5`}
                    activeClassName={activeClass}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
        {collapsed && (
          <NavLink
            to="/admin/general"
            className={`${linkClass} justify-center mt-4`}
            activeClassName={activeClass}
          >
            <Settings size={20} className="flex-shrink-0" />
          </NavLink>
        )}
      </nav>

      {/* Theme + Collapse (desktop only) */}
      <div className="hidden md:block px-3 pb-1 space-y-0.5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center p-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Mobile theme toggle */}
      <div className="md:hidden px-3 pb-2">
        <button onClick={toggleTheme} className={`w-full ${linkClass}`}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
        </button>
      </div>

      {/* User area */}
      <div className="border-t border-border p-3">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {name}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 flex-shrink-0"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex h-screen sticky top-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 flex flex-col bg-card border-r border-border/30 z-50 md:hidden animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
