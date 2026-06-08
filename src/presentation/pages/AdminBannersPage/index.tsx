import useAdminBannersQuery from "@/presentation/hooks/use-admin-banners-query";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { Image, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import AddBannerModal from "../../components/banner/AddBannerModal";
import DeleteBannerModal from "../../components/banner/DeleteBannerModal";
import BannerListItem from "../AdminGeneralPage/components/BannerListItem";

export default function AdminBanners() {
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
    setDeleteModalOpen(open);
    if (!open) {
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
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

      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Banners</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Gerencie os banners do dashboard dos sellers
            </p>
          </div>
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
      </div>
    </AdminLayout>
  );
}
