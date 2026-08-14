import pixLogo from "@/assets/pix-logo.svg";
import { cn } from "@/presentation/utils/cn";

interface IPixIconProps {
  className?: string;
}

export function PixIcon({ className }: IPixIconProps) {
  return (
    <img
      src={pixLogo}
      alt=""
      aria-hidden
      className={cn("h-4 w-4 object-contain", className)}
    />
  );
}
