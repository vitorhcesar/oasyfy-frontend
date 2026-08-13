import logoHorizontalBlack from "@/assets/logos/horizontal-black.png";
import logoHorizontalPurple from "@/assets/logos/horizontal-purple.png";
import logoHorizontalWhite from "@/assets/logos/horizontal-white.png";
import iconBlack from "@/assets/logos/icon-black.svg";
import iconPurple from "@/assets/logos/icon-purple.svg";
import iconWhite from "@/assets/logos/icon-white.svg";
import { cn } from "@/presentation/utils/cn";

type TLogoVariant = "white" | "black" | "purple";

const horizontalByVariant: Record<TLogoVariant, string> = {
  white: logoHorizontalWhite,
  black: logoHorizontalBlack,
  purple: logoHorizontalPurple,
};

const iconByVariant: Record<TLogoVariant, string> = {
  white: iconWhite,
  black: iconBlack,
  purple: iconPurple,
};

interface IAuthBrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** white = fundo dark; black = fundo claro; purple = acento de marca (asset legado) */
  variant?: TLogoVariant;
  /** `horizontal` = wordmark; `icon` = só o símbolo */
  mark?: "horizontal" | "icon";
}

export function AuthBrandMark({
  className,
  size = "md",
  variant = "white",
  mark = "horizontal",
}: IAuthBrandMarkProps) {
  const heightClass =
    mark === "icon"
      ? size === "lg"
        ? "h-14 w-14"
        : size === "sm"
          ? "h-9 w-9"
          : "h-11 w-11"
      : size === "lg"
        ? "h-14 sm:h-16"
        : size === "sm"
          ? "h-9"
          : "h-12";

  const src =
    mark === "icon" ? iconByVariant[variant] : horizontalByVariant[variant];

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={src}
        alt="Oasyfy"
        className={cn(
          "w-auto object-contain object-left",
          heightClass,
          mark === "horizontal" && size === "lg" && "max-w-[300px] sm:max-w-[340px]",
          mark === "horizontal" && size === "md" && "max-w-[240px]",
          mark === "horizontal" && size === "sm" && "max-w-[180px]"
        )}
      />
    </div>
  );
}
