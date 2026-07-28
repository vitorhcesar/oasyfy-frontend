import { IAdminBannerDto } from "@/infra/http/services/api/modules/admin-banner.module";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ExternalLink, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState } from "react";

interface IBannerListItemProps {
  banner: IAdminBannerDto;
  openDeleteModal: (bannerId: number) => void;
  invalidateQuery: () => Promise<void>;
}

export default function BannerListItem({
  banner,
  openDeleteModal,
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
        "admin-surface overflow-hidden",
        toggling && "animate-pulse",
      )}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="h-16 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {banner.title || "Sem título"}
          </p>
          {banner.linkUrl && (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink size={12} /> {banner.linkUrl}
            </a>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            Ordem: {banner.displayOrder} ·{" "}
            {new Date(banner.createdAt).toLocaleDateString("pt-BR")}
          </p>
          <span
            className={cn(
              "mt-2 inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
              banner.isActive
                ? "border-success/25 bg-success/10 text-success"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {banner.isActive ? "Ativo" : "Inativo"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleActive(banner)}
            className={cn(
              "rounded-lg p-2 transition-colors",
              banner.isActive
                ? "text-success hover:bg-success/10"
                : "text-muted-foreground hover:bg-muted",
            )}
            title={banner.isActive ? "Desativar" : "Ativar"}
          >
            {banner.isActive ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(banner.id)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
