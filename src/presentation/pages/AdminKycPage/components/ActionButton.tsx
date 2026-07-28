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
      ? "border-transparent bg-white text-[#0F0617] hover:bg-white/90"
      : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground";

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all disabled:opacity-40 ${base}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
