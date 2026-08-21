import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { NavLink } from "@/presentation/components/NavLink";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/presentation/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/presentation/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/presentation/components/ui/tooltip";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useUserContext } from "@/presentation/context/UserContext";
import { useIsDesktop } from "@/presentation/hooks/use-mobile";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileCheck,
  Image,
  Layers,
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
  Swords,
  Target,
  UserCog,
  MessagesSquare,
  Link2,
  Webhook,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type TSidebarIcon =
  | LucideIcon
  | ((props: { size?: number; className?: string }) => ReactNode);
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "A Praça", url: "/admin/praca", icon: MessagesSquare },
  { title: "Produtores", url: "/admin/kyc", icon: FileCheck },
];

const financialSubItems = [
  { title: "Vendas", url: "/admin/transactions", icon: Receipt },
  { title: "Webhooks", url: "/admin/webhooks", icon: Webhook },
  { title: "Saques", url: "/admin/withdrawals", icon: ArrowLeftRight },
  { title: "Minigames", url: "/admin/minigames", icon: Swords },
  { title: "Metas", url: "/admin/goals", icon: Target },
  { title: "Reembolsos", url: "/admin/refunds", icon: RotateCcw },
];

const settingsSubItems = [
  { title: "Geral", url: "/admin/general", icon: Sliders },
  { title: "Adquirente", url: "/admin/acquirer", icon: CreditCard },
  { title: "Planos de taxa", url: "/admin/fee-templates", icon: Layers },
  { title: "E-mail", url: "/admin/email", icon: Mail },
  { title: "Checkout", url: "/admin/checkout", icon: Link2 },
  {
    title: "CRM",
    url: "/admin/crm",
    icon: ({ size = 18, className }: { size?: number; className?: string }) => (
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
  { title: "Banners", url: "/admin/banners", icon: Image },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const ADMIN_SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean) {
  try {
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // ignore quota / private mode errors
  }
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const isDesktop = useIsDesktop();
  const user = useUserContext();
  const { signOut } = useAuthContext();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeContext();
  const name = user?.name || user?.email || "Admin";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isOnSettings =
    location.pathname.startsWith("/admin/general") ||
    location.pathname.startsWith("/admin/acquirer") ||
    location.pathname.startsWith("/admin/fee-templates") ||
    location.pathname.startsWith("/admin/email") ||
    location.pathname.startsWith("/admin/checkout") ||
    location.pathname.startsWith("/admin/crm") ||
    location.pathname.startsWith("/admin/2fa") ||
    location.pathname.startsWith("/admin/managers");
  const isOnFinancial = financialSubItems.some((i) =>
    location.pathname.startsWith(i.url),
  );
  const [settingsOpen, setSettingsOpen] = useState(isOnSettings);
  const [financialOpen, setFinancialOpen] = useState(isOnFinancial);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsedPreference(next);
      return next;
    });
  };

  useEffect(() => {
    if (mobileOpen && onClose) onClose();
    // eslint-disable-next-line
  }, [location.pathname]);

  useEffect(() => {
    if (isOnFinancial) setFinancialOpen(true);
  }, [isOnFinancial]);

  useEffect(() => {
    if (isOnSettings) setSettingsOpen(true);
  }, [isOnSettings]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const logoVariant = theme === "dark" ? "white" : "black";

  const linkClass =
    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-all duration-200";
  const activeClass =
    "bg-black/[0.06] text-foreground font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:bg-white/15";
  const flyoutClass =
    "z-50 rounded-xl border border-white/10 bg-popover/95 p-0 text-popover-foreground shadow-lg md:backdrop-blur-md";
  const flyoutItemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground";

  const renderAvatarBadge = () => (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
      <span className="text-sm font-bold text-primary">{initials}</span>
    </div>
  );

  const renderCollapsedNavTooltip = (
    item: (typeof menuItems)[number],
  ) => (
    <Tooltip key={item.url} delayDuration={150}>
      <TooltipTrigger asChild>
        <NavLink
          to={item.url}
          end={item.url === "/admin"}
          className={cn(linkClass, "justify-center")}
          activeClassName={activeClass}
        >
          <item.icon size={19} className="flex-shrink-0" />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="rounded-lg px-3 py-1.5">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );

  const renderCollapsedGroupHover = (
    label: string,
    items: Array<{
      title: string;
      url: string;
      icon: TSidebarIcon;
    }>,
    icon: TSidebarIcon,
    isActive: boolean,
    className?: string,
  ) => {
    const Icon = icon;
    return (
      <HoverCard openDelay={120} closeDelay={120}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className={cn(
              linkClass,
              "w-full justify-center",
              className,
              isActive && activeClass,
            )}
          >
            <Icon size={19} className="flex-shrink-0" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          sideOffset={12}
          className={cn(flyoutClass, "w-56 p-2")}
        >
          <p className="mb-1 px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            {label}
          </p>
          <div className="space-y-0.5">
            {items.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end
                className={flyoutItemClass}
                activeClassName={activeClass}
              >
                <item.icon size={16} className="flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderSidebarContent = (isCollapsed: boolean, isMobile = false) => (
    <>
      <div
        className={cn(
          "relative flex h-[4.5rem] items-center justify-center border-b border-white/10",
          isCollapsed ? "px-2" : "px-5",
        )}
      >
        {isCollapsed ? (
          <AuthBrandMark mark="icon" size="sm" variant={logoVariant} />
        ) : (
          <AuthBrandMark
            size="sm"
            variant={logoVariant}
            className="justify-center"
          />
        )}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/30"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-hide">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            Principal
          </p>
        )}
        {isCollapsed
          ? menuItems.map((item) => renderCollapsedNavTooltip(item))
          : menuItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/admin"}
                className={linkClass}
                activeClassName={activeClass}
              >
                <item.icon size={19} className="flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}

        {!isCollapsed && (
          <div className="mt-5">
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              Comercial
            </p>
            <Collapsible open={financialOpen} onOpenChange={setFinancialOpen}>
              <CollapsibleTrigger
                className={cn(
                  linkClass,
                  "w-full",
                  isOnFinancial && "text-primary",
                )}
              >
                <CreditCard size={19} className="flex-shrink-0" />
                <span className="flex-1 text-left">Financeiro</span>
                <ChevronDown
                  size={15}
                  className={cn(
                    "flex-shrink-0 text-muted-foreground/40 transition-transform duration-300",
                    financialOpen && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-5 mt-1 space-y-0.5 border-l border-border/25 py-1 pl-3">
                  {financialSubItems.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end
                      className={cn(linkClass, "py-2.5 text-sm")}
                      activeClassName={activeClass}
                    >
                      <item.icon size={17} className="flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        {isCollapsed &&
          renderCollapsedGroupHover(
            "Financeiro",
            financialSubItems,
            CreditCard,
            isOnFinancial,
            "mt-2",
          )}

        {!isCollapsed && (
          <div className="mt-5">
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              Sistema
            </p>
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger
                className={cn(
                  linkClass,
                  "w-full",
                  isOnSettings && "text-primary",
                )}
              >
                <Settings size={19} className="flex-shrink-0" />
                <span className="flex-1 text-left">Configurações</span>
                <ChevronDown
                  size={15}
                  className={cn(
                    "flex-shrink-0 text-muted-foreground/40 transition-transform duration-300",
                    settingsOpen && "rotate-180",
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-5 mt-1 space-y-0.5 border-l border-border/25 py-1 pl-3">
                  {settingsSubItems.map((item) => (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      end
                      className={cn(linkClass, "py-2.5 text-sm")}
                      activeClassName={activeClass}
                    >
                      <item.icon size={17} className="flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        {isCollapsed &&
          renderCollapsedGroupHover(
            "Configurações",
            settingsSubItems,
            Settings,
            isOnSettings,
            "mt-4",
          )}
      </nav>

      <div className="space-y-1 px-3 pb-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <div className="border-t border-white/10 p-3.5">
        {isCollapsed ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="mx-auto flex rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Menu do perfil"
              >
                {renderAvatarBadge()}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="end"
              sideOffset={12}
              className={cn(flyoutClass, "w-64 overflow-hidden")}
            >
              <div className="flex items-center gap-3 border-b border-white/10 bg-muted/20 px-4 py-3.5">
                {renderAvatarBadge()}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  {user?.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex items-center gap-3">
            {renderAvatarBadge()}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">
                {name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {isDesktop && (
        <aside
          className={cn(
            "liquid-glass hidden h-full shrink-0 flex-col transition-all duration-300 ease-in-out md:flex",
            "rounded-2xl",
            collapsed ? "w-[76px]" : "w-[248px]",
          )}
        >
          {renderSidebarContent(collapsed)}
        </aside>
      )}

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 md:hidden"
            onClick={onClose}
          />
          <aside className="liquid-glass !fixed top-4 bottom-4 left-3 z-50 flex w-[min(16.5rem,calc(100vw-6.5rem))] flex-col rounded-[2rem] md:hidden animate-in slide-in-from-left duration-200">
            {renderSidebarContent(false, true)}
          </aside>
        </>
      )}
    </>
  );
}
