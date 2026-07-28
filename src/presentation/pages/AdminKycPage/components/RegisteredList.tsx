import { ChevronRight, User } from "lucide-react";
import { useAdminKycPageStore } from "../stores/admin-kyc-page.store";
import { IRegisteredSellerView } from "../types/kyc-submission-view.type";
import { mapRegisteredSellerToKycView } from "../utils/map-admin-kyc-submissions-to-view.util";

interface IRegisteredListProps {
  filteredRegistered: IRegisteredSellerView[];
  timeAgo: (date: string) => string;
}

export default function RegisteredList({
  filteredRegistered,
  timeAgo,
}: IRegisteredListProps) {
  const { setSelectedSeller } = useAdminKycPageStore();

  return (
    <div className="admin-surface overflow-hidden divide-y divide-border/50">
      {filteredRegistered.map((seller) => (
        <button
          key={seller.user_id}
          onClick={() =>
            setSelectedSeller(mapRegisteredSellerToKycView(seller))
          }
          className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/25"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <User size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {seller.full_name || "Sem nome"}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {seller.email || "—"}
            </p>
            <p className="truncate font-mono text-sm text-muted-foreground">
              {seller.account_id || `#${seller.user_id}`}
            </p>
          </div>
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Sem documentos
          </span>
          <span className="w-12 flex-shrink-0 text-right text-sm text-muted-foreground">
            {timeAgo(seller.created_at)}
          </span>
          <ChevronRight
            size={16}
            className="flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          />
        </button>
      ))}
    </div>
  );
}
