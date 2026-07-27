import cartwaveLogo from "@/assets/cartwave-logo.png";
import wooviLogo from "@/assets/woovi-logo.svg";
import {
  getPixAcquirerProviderLabel,
  inferPixAcquirerProvider,
  type IPixAcquirerConnectionLike,
} from "@/presentation/utils/pix-acquirer-provider";
import { cn } from "@/presentation/utils/cn";

const logoMap: Record<string, string> = {
  cartwave: cartwaveLogo,
  woovi: wooviLogo,
  openpix: wooviLogo,
};

interface IAcquirerBrandLogoProps {
  connection: IPixAcquirerConnectionLike;
  className?: string;
  imageClassName?: string;
}

export function AcquirerBrandLogo({
  connection,
  className,
  imageClassName = "w-8 h-8 object-contain",
}: IAcquirerBrandLogoProps) {
  const provider = inferPixAcquirerProvider(connection);
  const logoKey = connection.logo_key?.trim().toLowerCase();
  const src =
    (logoKey && logoMap[logoKey]) ||
    logoMap[provider] ||
    null;

  if (src) {
    return (
      <img
        src={src}
        alt={connection.name ?? getPixAcquirerProviderLabel(provider)}
        className={cn(imageClassName, className)}
        loading="lazy"
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase",
        className,
      )}
    >
      {getPixAcquirerProviderLabel(provider).slice(0, 2)}
    </span>
  );
}

export function getAcquirerLogoSrc(connection: IPixAcquirerConnectionLike) {
  const provider = inferPixAcquirerProvider(connection);
  const logoKey = connection.logo_key?.trim().toLowerCase();
  return (logoKey && logoMap[logoKey]) || logoMap[provider] || null;
}
