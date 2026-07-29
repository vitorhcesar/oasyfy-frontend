import { useApiService } from "@/presentation/hooks/use-api-service";
import useSellerFeeQuery from "@/presentation/hooks/use-seller-fee-query";
import { useSellerKycSubmissionQuery } from "@/presentation/hooks/use-seller-kyc-submission-query";
import useSellerProfileQuery from "@/presentation/hooks/use-seller-profile-query";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useUserContext } from "@/presentation/context/UserContext";
import { cn } from "@/presentation/utils/cn";
import {
  BookOpen,
  ChevronDown,
  FileCheck,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  type LucideIcon,
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
  const { data: profile } = useSellerProfileQuery();
  const { canSell, isLoading: kycLoading } = useSellerKycSubmissionQuery();
  const navigate = useNavigate();

  const user = useUserContext();
  const { signOut } = useAuthContext();
  const { theme, toggleTheme } = useThemeContext();

  const [open, setOpen] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [billingGoal, setBillingGoal] = useState(0);
  const isKycLocked = kycLoading || !canSell;

  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null
  );

  const avatarUrl = profile?.avatarUrl ?? null;
  const name =
    profile?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Seller";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!user) return;

    apiService.modules.balance.get().then((balance) => {
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

  const menuItems: Array<{
    label: string;
    icon: LucideIcon;
    action: () => void;
    locked?: boolean;
  }> = [
    {
      label: "Perfil",
      icon: User,
      action: () => navigate("/seller/settings"),
      locked: isKycLocked,
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/seller"),
      locked: isKycLocked,
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
    <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-white/10 md:hidden"
        >
          <Menu size={22} />
        </button>

        {billingGoal > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-semibold tabular-nums text-foreground">
              {formatCompact(totalRevenue)}
              <span className="font-normal text-muted-foreground"> / </span>
              {formatCompact(billingGoal)}
            </span>
            <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10 md:w-28">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div ref={ref} className="relative">
        <button
          ref={triggerRef}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-white/10 md:px-3"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover ring-1 ring-primary/25"
            />
          ) : (
            <User size={16} className="text-muted-foreground" />
          )}
          <span className="hidden font-medium sm:inline">
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
              className="fixed z-50 w-56 rounded-xl border border-white/10 bg-popover/95 py-2 text-popover-foreground shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center gap-3 border-b border-white/10 bg-muted/20 px-4 py-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-primary/25"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
                    <span className="text-xs font-semibold text-primary">
                      {initials}
                    </span>
                  </div>
                )}
                <span className="truncate text-sm font-medium text-foreground">
                  {name}
                </span>
              </div>

              <div className="py-1">
                {menuItems.map((item) =>
                  item.locked ? (
                    <div
                      key={item.label}
                      className="flex w-full cursor-not-allowed select-none items-center gap-3 px-4 py-2 text-sm text-muted-foreground/25"
                      title="Disponível após aprovação do KYC"
                    >
                      <item.icon size={15} className="shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <Lock size={11} className="shrink-0 opacity-40" />
                    </div>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                    >
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  ),
                )}
              </div>

              <div className="border-t border-white/10 py-1">
                <button
                  onClick={() => {
                    toggleTheme();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                </button>
              </div>

              <div className="border-t border-white/10 py-1">
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
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
