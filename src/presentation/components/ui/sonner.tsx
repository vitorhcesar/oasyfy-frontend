import { useIsDesktop } from "@/presentation/hooks/use-mobile";
import { useThemeContext } from "@/presentation/hooks/use-theme";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const MOBILE_OFFSET = {
  top: "max(12px, env(safe-area-inset-top, 0px))",
  bottom: "max(12px, env(safe-area-inset-bottom, 0px))",
  left: 12,
  right: 12,
} as const;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useThemeContext();
  const isDesktop = useIsDesktop();

  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast w-full max-w-full group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
      theme={theme}
      position={isDesktop ? "bottom-right" : "top-center"}
      offset={16}
      mobileOffset={MOBILE_OFFSET}
    />
  );
};

export { Toaster, toast };
