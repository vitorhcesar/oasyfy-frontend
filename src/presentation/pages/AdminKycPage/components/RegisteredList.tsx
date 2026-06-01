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
    <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40">
      {filteredRegistered.map((seller) => (
        <button
          key={seller.user_id}
          onClick={() =>
            setSelectedSeller(mapRegisteredSellerToKycView(seller))
          }
          className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
            <User size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {seller.full_name || "Sem nome"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
              {seller.email || "—"}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
              {seller.account_id || `#${seller.user_id}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            <span className="text-xs font-medium text-muted-foreground">
              Sem documentos
            </span>
          </div>
          <span className="text-xs text-muted-foreground/40 flex-shrink-0 w-12 text-right">
            {timeAgo(seller.created_at)}
          </span>
          <ChevronRight
            size={14}
            className="text-muted-foreground/30 flex-shrink-0"
          />
        </button>
      ))}
    </div>
  );
}
