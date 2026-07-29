import useBannersQuery from "@/presentation/hooks/use-banners-query";

export default function Banners() {
  const { data: banners } = useBannersQuery();

  if (banners.length === 0) return null;

  return (
    <div className="mb-7 space-y-3">
      {banners.map((b) =>
        b.linkUrl ? (
          <a
            key={b.id}
            href={b.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-[1.25rem] transition-opacity hover:opacity-95"
          >
            <img
              src={b.imageUrl}
              alt="Banner"
              className="h-auto max-h-[180px] w-full rounded-[1.25rem] object-cover md:max-h-none"
            />
          </a>
        ) : (
          <div key={b.id} className="overflow-hidden rounded-[1.25rem]">
            <img
              src={b.imageUrl}
              alt="Banner"
              className="h-auto max-h-[180px] w-full rounded-[1.25rem] object-cover md:max-h-none"
            />
          </div>
        )
      )}
    </div>
  );
}
