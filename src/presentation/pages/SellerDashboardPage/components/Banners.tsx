import useBannersQuery from "@/presentation/hooks/use-banners-query";

export default function Banners() {
  const { data: banners } = useBannersQuery();

  if (banners.length === 0) return null;

  return (
    <div className="space-y-2.5 mb-6">
      {banners.map((b) =>
        b.linkUrl ? (
          <a
            key={b.id}
            href={b.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl overflow-hidden hover:opacity-95 transition-opacity"
          >
            <img
              src={b.imageUrl}
              alt="Banner"
              className="w-full h-auto rounded-xl object-cover max-h-[180px] md:max-h-none"
            />
          </a>
        ) : (
          <div key={b.id} className="rounded-xl overflow-hidden">
            <img
              src={b.imageUrl}
              alt="Banner"
              className="w-full h-auto rounded-xl object-cover max-h-[180px] md:max-h-none"
            />
          </div>
        )
      )}
    </div>
  );
}
