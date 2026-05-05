import { isNil } from "@/shared/utils/is-nil";
import { useRef } from "react";
import { cn } from "../utils/cn";

function getNewValue(value: string, index: number, char: string): string {
  const valueIndexExists = !isNil(value[index]);
  if (valueIndexExists) {
    return value.slice(0, index) + char + value.slice(index + 1);
  }

  return value + char;
}

interface IOtpInputProps {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  className?: string;
  onPasteFullfilled?: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  className,
  onPasteFullfilled,
  disabled = false,
}: IOtpInputProps) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, char: string) => {
    if (char && !/^\d$/.test(char)) return;

    const newValue = value ? getNewValue(value, index, char) : char;

    onChange?.(newValue);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (isNil(value)) return;

    const isBackspaceAndIndexIsBiggerThan0 = e.key === "Backspace" && index > 0;
    const isBackspaceAndIndexIs0 = e.key === "Backspace" && index === 0;
    const isArrowLeft = e.key === "ArrowLeft";
    const isArrowRight = e.key === "ArrowRight";

    if (isBackspaceAndIndexIsBiggerThan0 && isNil(value[index])) {
      const otpRef = otpRefs.current[index - 1];
      if (otpRef) {
        console.log("focusing previous input");
        otpRef.focus();
        otpRef.setSelectionRange(0, otpRef.value.length);
      }
    } else if (isBackspaceAndIndexIs0) {
      return;
    } else if (isArrowLeft) {
      const previousOtpRef = otpRefs.current[index - 1];
      if (previousOtpRef) {
        previousOtpRef.focus();
        previousOtpRef.setSelectionRange(0, previousOtpRef.value.length);
      }
    } else if (isArrowRight) {
      const nextOtpRef = otpRefs.current[index + 1];
      if (nextOtpRef) {
        nextOtpRef.focus();
        nextOtpRef.setSelectionRange(0, nextOtpRef.value.length);
      }
    } else {
      const nextOtpRef = otpRefs.current[index + 1];
      if (nextOtpRef) {
        nextOtpRef.focus();
        nextOtpRef.setSelectionRange(0, nextOtpRef.value.length);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange?.(pastedText);

    if (pastedText.length === length) onPasteFullfilled?.(pastedText);
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
