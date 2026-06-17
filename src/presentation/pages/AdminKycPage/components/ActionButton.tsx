import { Loader2 } from "lucide-react";

interface IActionBtnProps {
  onClick: () => void;
  variant: "approve" | "reject";
  label: string;
  loading?: boolean;
  disabled?: boolean;
}

export function ActionButton({
  onClick,
  variant,
  label,
  loading,
  disabled,
}: IActionBtnProps) {
  const base =
    variant === "approve"
      ? "text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
      : "text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground";

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 ${base}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
