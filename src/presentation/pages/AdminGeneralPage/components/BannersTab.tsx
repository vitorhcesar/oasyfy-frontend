import { Image, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import AddBannerModal from "../../../components/banner/AddBannerModal";
import DeleteBannerModal from "../../../components/banner/DeleteBannerModal";
import useAdminBannersQuery from "../../../hooks/use-admin-banners-query";
import BannerListItem from "./BannerListItem";

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

      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Gerencie os banners do dashboard dos sellers.
        </p>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#0F0617] transition-opacity hover:opacity-90"
        >
          <Plus size={15} />
          Novo banner
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : banners.length === 0 ? (
        <div className="admin-surface px-6 py-16 text-center">
          <Image className="mx-auto mb-3 text-muted-foreground" size={24} />
          <p className="mb-1 text-base font-semibold text-foreground">
            Nenhum banner
          </p>
          <p className="text-sm text-muted-foreground">
            Adicione banners para exibir no dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
