import PageHeader from "@/presentation/components/PageHeader";
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

      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Marketing"
          title="Banners"
          description="Gerencie os banners do dashboard dos sellers."
          actions={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
            >
              <Plus size={15} />
              Novo banner
            </button>
          }
        />

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
      </div>
    </AdminLayout>
  );
}
