import { Image, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import AddBannerModal from "../../../components/banner/AddBannerModal";
import useAdminBannersQuery from "../../../hooks/use-admin-banners-query";
import BannerListItem from "./BannerListItem";
import DeleteBannerModal from "../../../components/banner/DeleteBannerModal";

export function BannersTab() {
  const {
    data: banners,
    isLoading,
    invalidateQuery: invalidateBannersQuery,
  } = useAdminBannersQuery();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleOpenDeleteModal = (bannerId: number) => {
    setDeleteModalOpen(true);
    setDeleteId(bannerId);
  };

  const handleDeleteModalOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteModalOpen(false);
      setDeleteId(null);
    }

    setDeleteModalOpen(false);
    setDeleteId(null);
  };

  return (
    <>
      <AddBannerModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onInvalidateQuery={invalidateBannersQuery}
      />

      <DeleteBannerModal
        open={deleteModalOpen}
        onOpenChange={handleDeleteModalOpenChange}
        deleteId={deleteId}
        onInvalidateQuery={invalidateBannersQuery}
      />

      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-muted-foreground">
          Gerencie os banners do dashboard dos sellers
        </p>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={13} />
          Novo banner
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Image className="text-muted-foreground/40" size={18} />
          </div>
          <p className="text-xs font-medium text-foreground mb-0.5">
            Nenhum banner
          </p>
          <p className="text-xs text-muted-foreground">
            Adicione banners para exibir no dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {banners.map((banner) => (
            <BannerListItem
              key={banner.id}
              banner={banner}
              openDeleteModal={handleOpenDeleteModal}
              invalidateQuery={invalidateBannersQuery}
            />
          ))}
        </div>
      )}
    </>
  );
}
