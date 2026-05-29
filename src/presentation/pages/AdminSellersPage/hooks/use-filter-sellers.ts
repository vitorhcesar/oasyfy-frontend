import type { IAdminSellerDto } from "@/infra/http/services/api/modules/admin-sellers.module";
import { useMemo } from "react";
import { TFilterKey } from "../types/filter-key.type";

interface IUseFilterSellersParams {
  sellers: IAdminSellerDto[];
  filter: TFilterKey;
  search: string;
}

export default function useFilterSellers({
  sellers,
  filter,
  search,
}: IUseFilterSellersParams) {
  return useMemo(() => {
    let list = sellers;

    if (filter !== "all") {
      if (filter === "under_review") {
        list = list.filter(
          (seller) =>
            seller.kycStatus === "under_review" ||
            seller.kycStatus === "pending",
        );
      } else {
        list = list.filter((seller) => seller.kycStatus === filter);
      }
    }

    if (search) {
      const query = search.toLowerCase();
      list = list.filter(
        (seller) =>
          seller.fullName?.toLowerCase().includes(query) ||
          String(seller.userId).includes(query),
      );
    }

    return list;
  }, [sellers, filter, search]);
}
