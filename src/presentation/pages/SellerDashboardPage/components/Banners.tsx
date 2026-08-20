import useBannersQuery from "@/presentation/hooks/use-banners-query";
import { cn } from "@/presentation/utils/cn";

export default function Banners() {
  const { data: banners } = useBannersQuery();

  if (banners.length === 0) return null;

  return (
    <div className="mb-7 space-y-3">
      {banners.map((b) => {
        const frameClass = cn(
          "block w-full overflow-hidden rounded-xl",
          "aspect-[16/9] sm:aspect-[21/9] sm:rounded-2xl",
          "md:aspect-auto md:min-h-[140px] md:max-h-[280px]",
        );
        const image = (
          <img
            src={b.imageUrl}
            alt="Banner"
            className="h-full w-full object-cover object-center"
          />
        );

        if (b.linkUrl) {
          return (
            <a
              key={b.id}
              href={b.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(frameClass, "transition-opacity hover:opacity-95")}
            >
              {image}
            </a>
          );
        }

        return (
          <div key={b.id} className={frameClass}>
            {image}
          </div>
        );
      })}
    </div>
  );
}
