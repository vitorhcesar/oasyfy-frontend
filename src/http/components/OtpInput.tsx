import { isNil } from "@/shared/utils/is-nil";
import { useRef } from "react";
import { cn } from "../utils/cn";

interface IOtpInputProps {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  className?: string;
  onFullfilled?: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  className,
  onFullfilled,
  disabled = false,
}: IOtpInputProps) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, newValue: string) => {
    if (newValue && !/^\d$/.test(newValue)) return;

    onChange?.(newValue);

    if (index < length - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newValue.length === length) onFullfilled?.(newValue);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (isNil(value)) return;

    if (e.key === "Backspace" && !value[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange?.(pastedText);

    if (pastedText.length === length) onFullfilled?.(pastedText);
  };

  return (
    <div
      className="flex items-center justify-center gap-2.5 mb-6"
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            otpRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value?.[i] || ""}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className={cn(
            "w-11 h-12 text-center text-lg font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50",
            className
          )}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
