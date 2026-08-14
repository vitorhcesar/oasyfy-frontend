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
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerProfileQuery from "@/presentation/hooks/use-seller-profile-query";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { cn } from "@/presentation/utils/cn";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
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
  Users,
  Link2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ISellerSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface INavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  locked?: boolean;
}

const SELLER_SIDEBAR_COLLAPSED_KEY = "seller-sidebar-collapsed";

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SELLER_SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean) {
  try {
    localStorage.setItem(SELLER_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    // ignore quota / private mode errors
  }
}

export function SellerSidebar({ mobileOpen, onClose }: ISellerSidebarProps) {
  const user = useUserContext();
  const { signOut } = useAuthContext();
  const { theme } = useThemeContext();
  const { data: profile } = useSellerProfileQuery();
  const { canSell, isLoading: kycLoading } = useSellerKycSubmissionQuery();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  const isOnSettingsPage =
    location.pathname.startsWith("/seller/settings") ||
    location.pathname.startsWith("/seller/kyc") ||
    location.pathname.startsWith("/seller/2fa") ||
    location.pathname.startsWith("/seller/notifications");
  const [settingsOpen, setSettingsOpen] = useState(isOnSettingsPage);

  const isKycLocked = kycLoading || !canSell;
  const isWithdrawLocked = kycLoading || !canSell;

  const name =
    profile?.displayName || user?.name || user?.email?.split("@")[0] || "Seller";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = profile?.avatarUrl ?? null;

  const mainItems: INavItem[] = [
    { title: "Início", url: "/seller", icon: Home, locked: isKycLocked },
    {
      title: "Transações",
      url: "/seller/transactions",
      icon: ArrowLeftRight,
      locked: isKycLocked,
    },
  ];

  const financeItems: INavItem[] = [
    {
      title: "Depósito",
      url: "/seller/deposit",
      icon: ArrowDownLeft,
      locked: isKycLocked,
    },
    {
      title: "Saques",
      url: "/seller/transfers",
      icon: ArrowUpRight,
      locked: isWithdrawLocked,
    },
    {
      title: "Checkouts",
      url: "/seller/checkouts",
      icon: Link2,
      locked: isKycLocked,
    },
    {
      title: "Sócios",
      url: "/seller/partners",
      icon: Users,
      locked: isKycLocked,
    },
  ];

  const settingsSubItems: INavItem[] = [
    {
      title: "Perfil",
      url: "/seller/settings",
      icon: User,
      locked: isKycLocked,
    },
    {
      title: "Notificações",
      url: "/seller/notifications",
      icon: Bell,
      locked: false,
    },
    { title: "Documentos", url: "/seller/kyc", icon: FileText, locked: false },
    { title: "2FA", url: "/seller/2fa", icon: ShieldCheck, locked: false },
  ];

  const devItems: INavItem[] = [
    { title: "API", url: "/seller/api", icon: Code2 },
    { title: "Integração", url: "/seller/apps", icon: Blocks },
  ];

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
    if (isOnSettingsPage) setSettingsOpen(true);
  }, [isOnSettingsPage]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login/seller");
  };

  const logoVariant = theme === "dark" ? "white" : "black";

  const linkClass =
    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all duration-200";
  const activeClass =
    "bg-white/15 text-foreground font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";
  const flyoutClass =
    "z-50 rounded-xl border border-white/10 bg-popover/95 p-0 text-popover-foreground shadow-lg backdrop-blur-md";
  const flyoutItemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground";
  const lockedClass =
    "flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] text-muted-foreground/25 cursor-not-allowed select-none";

  const renderAvatarBadge = () =>
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt=""
        className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-1 ring-primary/25"
      />
    ) : (
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
        <span className="text-sm font-bold text-primary">{initials}</span>
      </div>
    );

  const renderNavItem = (
    item: INavItem,
    options?: { collapsed?: boolean; small?: boolean; className?: string },
  ) => {
    const isItemCollapsed = options?.collapsed ?? false;
    const small = options?.small ?? false;
    const iconSize = small ? 17 : 19;
    const itemClass = cn(
      small ? cn(linkClass, "py-2.5 text-sm") : linkClass,
      isItemCollapsed && "justify-center",
      options?.className,
    );

    if (item.locked) {
      return (
        <div
          key={item.url}
          className={cn(
            small ? cn(lockedClass, "py-2.5 text-sm") : lockedClass,
            isItemCollapsed && "justify-center",
          )}
          title="Disponível após aprovação do KYC"
        >
          <item.icon size={iconSize} className="flex-shrink-0" />
          {!isItemCollapsed && <span className="flex-1">{item.title}</span>}
          {!isItemCollapsed && <Lock size={12} className="flex-shrink-0 opacity-40" />}
        </div>
      );
    }

    return (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.url === "/seller"}
        className={itemClass}
        activeClassName={activeClass}
      >
        <item.icon size={iconSize} className="flex-shrink-0" />
        {!isItemCollapsed && <span>{item.title}</span>}
      </NavLink>
    );
  };

  const renderCollapsedNavTooltip = (item: INavItem) => {
    if (item.locked) {
      return (
        <Tooltip key={item.url} delayDuration={150}>
          <TooltipTrigger asChild>
            <div
              className={cn(lockedClass, "justify-center")}
              title="Disponível após aprovação do KYC"
            >
              <item.icon size={19} className="flex-shrink-0" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="rounded-lg px-3 py-1.5">
            {item.title} (bloqueado)
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip key={item.url} delayDuration={150}>
        <TooltipTrigger asChild>
          <NavLink
            to={item.url}
            end={item.url === "/seller"}
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
  };

  const renderCollapsedGroupHover = (
    label: string,
    items: INavItem[],
    icon: LucideIcon,
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
            {items.map((item) =>
              item.locked ? (
                <div
                  key={item.url}
                  className={cn(flyoutItemClass, "cursor-not-allowed opacity-40")}
                  title="Disponível após aprovação do KYC"
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  <Lock size={11} className="opacity-60" />
                </div>
              ) : (
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
              ),
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderSidebarContent = (isCollapsed: boolean, isMobile = false) => (
    <>
      <div
        className={cn(
          "flex h-[4.5rem] items-center border-b border-white/10",
          isCollapsed ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        {isCollapsed ? (
          <AuthBrandMark mark="icon" size="sm" variant={logoVariant} />
        ) : (
          <AuthBrandMark size="sm" variant={logoVariant} />
        )}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/30"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-hide">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            Geral
          </p>
        )}
        {isCollapsed
          ? mainItems.map((item) => renderCollapsedNavTooltip(item))
          : mainItems.map((item) => renderNavItem(item))}

        {!isCollapsed && (
          <div className="mt-5">
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              Financeiro
            </p>
            <div className="space-y-0.5">
              {financeItems.map((item) => renderNavItem(item))}
            </div>
          </div>
        )}
        {isCollapsed &&
          financeItems.map((item) => (
            <div key={item.url} className="mt-0.5">
              {renderCollapsedNavTooltip(item)}
            </div>
          ))}

        {!isCollapsed && (
          <div className="mt-5">
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              Conta
            </p>
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger
                className={cn(
                  linkClass,
                  "w-full",
                  isOnSettingsPage && "text-primary",
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
                  {settingsSubItems.map((item) =>
                    renderNavItem(item, { small: true }),
                  )}
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
            isOnSettingsPage,
            "mt-4",
          )}

        {!isCollapsed && (
          <div className="mt-5">
            <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
              Developer
            </p>
            <div className="space-y-0.5">
              {devItems.map((item) => renderNavItem(item))}
            </div>
          </div>
        )}
        {isCollapsed &&
          devItems.map((item) => (
            <div key={item.url} className="mt-0.5">
              {renderCollapsedNavTooltip(item)}
            </div>
          ))}
      </nav>

      {!isMobile && (
        <div className="hidden space-y-1 px-3 pb-1 md:block">
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      )}

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
      <aside
        className={cn(
          "liquid-glass hidden h-full shrink-0 flex-col transition-all duration-300 ease-in-out md:flex",
          "rounded-2xl",
          collapsed ? "w-[76px]" : "w-[280px]",
        )}
      >
        {renderSidebarContent(collapsed)}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <aside className="liquid-glass fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col md:hidden animate-in slide-in-from-left duration-200">
            {renderSidebarContent(false, true)}
          </aside>
        </>
      )}
    </>
  );
}
