import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerFeeQuery from "@/presentation/hooks/use-seller-fee-query";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useUserContext } from "@/presentation/context/UserContext";
import { cn } from "@/presentation/utils/cn";
import {
  BookOpen,
  ChevronDown,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

function formatCompact(cents: number) {
  const val = cents / 100;
  if (val >= 1_000_000)
    return `${(val / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1).replace(".0", "")}K`;
  return val.toFixed(0);
}

interface ISellerTopbarProps {
  onMenuToggle?: () => void;
}

export function SellerTopbar({ onMenuToggle }: ISellerTopbarProps) {
  const apiService = useApiService();
  const { data: sellerFee } = useSellerFeeQuery();
  const navigate = useNavigate();

  const user = useUserContext();
  const { signOut } = useAuthContext();
  const { theme, toggleTheme } = useThemeContext();

  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [billingGoal, setBillingGoal] = useState(0);

  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );

  const name = user?.name || user?.email?.split("@")[0] || "Seller";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!user) return;

    Promise.all([
      apiService.modules.sellerPortal.getProfile(),
      apiService.modules.balance.get(),
    ]).then(([profile, balance]) => {
      if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
      setTotalRevenue(balance.grossSalesAmount);
    });
  }, [user, apiService]);

  useEffect(() => {
    if (sellerFee?.billingGoal) {
      setBillingGoal(sellerFee.billingGoal);
    }
  }, [sellerFee?.billingGoal]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const progress = useMemo(() => {
    if (billingGoal <= 0) return 0;
    return Math.min(100, (totalRevenue / billingGoal) * 100);
  }, [totalRevenue, billingGoal]);

  const menuItems = [
    { label: "Perfil", icon: User, action: () => navigate("/seller/settings") },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/seller"),
    },
    {
      label: "Meus documentos",
      icon: FileCheck,
      action: () => navigate("/seller/kyc"),
    },
    {
      label: "Documentação API",
      icon: BookOpen,
      action: () => navigate("/seller/api-docs"),
    },
  ];

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Billing goal bar */}
        {billingGoal > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-semibold text-foreground tabular-nums">
              {formatCompact(totalRevenue)}
              <span className="text-muted-foreground font-normal"> / </span>
              {formatCompact(billingGoal)}
            </span>
            <div className="w-20 md:w-28 h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div ref={ref} className="relative">
        <button
          ref={triggerRef}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User size={16} className="text-muted-foreground" />
          )}
          <span className="font-medium hidden sm:inline">
            {name.split(" ")[0]}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open &&
          menuPos &&
          createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, right: menuPos.right }}
              className="fixed w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg py-2 z-50"
            >
              <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50 bg-muted/30">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {initials}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground truncate">
                  {name}
                </span>
              </div>

              <div className="py-1">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <item.icon size={15} />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-border/50 py-1">
                <button
                  onClick={() => {
                    toggleTheme();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                </button>
              </div>

              <div className="border-t border-border/50 py-1">
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={15} />
                  Desconectar
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
