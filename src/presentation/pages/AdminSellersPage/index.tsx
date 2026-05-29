import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import AdminSellersEmptyState from "./components/AdminSellersEmptyState";
import AdminSellersFilters from "./components/AdminSellersFilters";
import AdminSellersPageHeader from "./components/AdminSellersPageHeader";
import AdminSellersTable from "./components/AdminSellersTable";
import useAdminSellersQuery from "./hooks/use-admin-sellers-query";
import useFilterSellers from "./hooks/use-filter-sellers";
import useSellerCounts from "./hooks/use-seller-counts";
import { useAdminSellersPageStore } from "./stores/admin-sellers-page.store";

export default function AdminSellersPage() {
  const { data: sellers, isLoading } = useAdminSellersQuery();
  const { filter, setFilter } = useAdminSellersPageStore();
  const [search, setSearch] = useState("");

  const filteredSellers = useFilterSellers({ sellers, filter, search });
  const counts = useSellerCounts(sellers);

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto w-full">
        <AdminSellersPageHeader />

        <AdminSellersFilters
          filter={filter}
          counts={counts}
          search={search}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredSellers.length === 0 ? (
          <AdminSellersEmptyState />
        ) : (
          <AdminSellersTable sellers={filteredSellers} />
        )}
      </div>
    </AdminLayout>
  );
}
