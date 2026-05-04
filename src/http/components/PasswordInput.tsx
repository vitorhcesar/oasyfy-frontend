import { Eye, EyeOff, Lock } from "lucide-react";
import React, { forwardRef, useCallback, useState } from "react";
import { IInputProps, Input } from "./Input";

const toggleBtnClass =
  "text-muted-foreground/50 transition-colors hover:text-muted-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

export interface PasswordInputProps
  extends Omit<IInputProps, "type" | "finalComponent"> {
  finalComponent?: React.ReactNode;
  /** `undefined`: ícone cadeado como no seller. `null`: sem elemento inicial. */
  startComponent?: React.ReactNode | null;
  /** Default: true. */
  showVisibilityToggle?: boolean;
  visiblePassword?: boolean;
  onVisiblePasswordChange?: (visible: boolean) => void;
  visibilityToggleLabelShow?: string;
  visibilityToggleLabelHide?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      startComponent,
      finalComponent,
      showVisibilityToggle = true,
      visiblePassword: controlledVisible,
      onVisiblePasswordChange,
      visibilityToggleLabelShow = "Ocultar senha",
      visibilityToggleLabelHide = "Mostrar senha",
      ...props
    },
    ref
  ) => {
    const [innerVisible, setInnerVisible] = useState(false);
    const controlled = controlledVisible !== undefined;
    const visible = controlled ? controlledVisible : innerVisible;

    const toggleVisible = useCallback(
      (next: boolean) => {
        if (!controlled) {
          setInnerVisible(next);
        }
        onVisiblePasswordChange?.(next);
      },
      [controlled, onVisiblePasswordChange]
    );

    const resolvedStart =
      startComponent === null ? undefined : startComponent === undefined ? (
        <Lock size={16} className="text-muted-foreground/50" />
      ) : (
        startComponent
      );

    const toggle = showVisibilityToggle ? (
      <button
        type="button"
        className={toggleBtnClass}
        aria-label={
          visible ? visibilityToggleLabelShow : visibilityToggleLabelHide
        }
        aria-pressed={visible}
        onClick={() => toggleVisible(!visible)}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    ) : null;

    const end =
      toggle != null ? (
        <span className="flex items-center gap-1.5">
          {finalComponent}
          {toggle}
        </span>
      ) : (
        finalComponent
      );

    return (
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        startComponent={resolvedStart}
        finalComponent={end ?? undefined}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
