import { IAdminBannerDto } from "@/infra/http/services/api/modules/admin-banner.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ExternalLink, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";

interface IBannerListItemProps {
  banner: IAdminBannerDto;
  setDeleteId: (id: number) => void;
  invalidateQuery: () => Promise<void>;
}

export default function BannerListItem({
  banner,
  setDeleteId,
  invalidateQuery,
}: IBannerListItemProps) {
  const apiService = useApiService();

  const [toggling, setToggling] = useState(false);

  const toggleActive = async (banner: IAdminBannerDto) => {
    setToggling(true);

    await tryOrToastError(
      async () => {
        await apiService.modules.adminBanners.toggleActive(banner.id);
        await invalidateQuery();
      },
      {
        defaultErrorMessage: "Erro ao ativar/desativar banner",
        finallyFn: () => {
          setToggling(false);
        },
      },
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border/40 overflow-hidden",
        toggling && "animate-pulse",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="w-32 h-16 rounded-lg overflow-hidden bg-muted/30 shrink-0">
          <img
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {banner.title || "Sem título"}
          </p>
          {banner.linkUrl && (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline"
            >
              <ExternalLink size={9} /> {banner.linkUrl}
            </a>
          )}
          <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
            Ordem: {banner.displayOrder} ·{" "}
            {new Date(banner.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleActive(banner)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              banner.isActive
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted/30",
            )}
            title={banner.isActive ? "Desativar" : "Ativar"}
          >
            {banner.isActive ? (
              <ToggleRight size={18} />
            ) : (
              <ToggleLeft size={18} />
            )}
          </button>
          <button
            onClick={() => setDeleteId(banner.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
