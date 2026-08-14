import { AdminLayout } from "@/presentation/layouts/AdminLayout";
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
  const { data: sellers, isLoading, invalidateQuery } = useAdminSellersQuery();
  const { filter, setFilter } = useAdminSellersPageStore();
  const [search, setSearch] = useState("");

  const filteredSellers = useFilterSellers({ sellers, filter, search });
  const counts = useSellerCounts(sellers);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
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
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filteredSellers.length === 0 ? (
          <AdminSellersEmptyState />
        ) : (
          <AdminSellersTable
            sellers={filteredSellers}
            onSellerDeleted={() => {
              void invalidateQuery();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
