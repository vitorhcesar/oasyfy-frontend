import type {
  IAdminSellerDto,
  TAdminSellerKycStatus,
} from "@/infra/http/services/api/modules/admin-sellers.module";
import { SELLER_STATUS_CONFIG } from "../constants/seller-status.config";

interface IAdminSellersTableProps {
  sellers: IAdminSellerDto[];
}

function SellerStatusBadge({ status }: { status: TAdminSellerKycStatus }) {
  const config = SELLER_STATUS_CONFIG[status] ?? SELLER_STATUS_CONFIG.sem_kyc;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium border ${config.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-border/40">
        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
          Seller
        </th>
        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
          ID
        </th>
        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
          Status
        </th>
        <th className="text-left px-5 py-3.5 font-medium text-muted-foreground/60 text-xs md:text-sm uppercase tracking-wider">
          Cadastro
        </th>
      </tr>
    </thead>
  );
}

interface ITableRowProps {
  seller: IAdminSellerDto;
  index: number;
}

function TableRow({ seller, index }: ITableRowProps) {
  return (
    <tr
      className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {(seller.fullName || "?")
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-foreground text-sm">
            {seller.fullName || "Sem nome"}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-muted-foreground/60 text-xs font-mono">
        #{seller.userId}
      </td>
      <td className="px-5 py-3.5">
        <SellerStatusBadge status={seller.kycStatus} />
      </td>
      <td className="px-5 py-3.5 text-muted-foreground/60 text-xs">
        {seller.createdAt
          ? new Date(seller.createdAt).toLocaleDateString("pt-BR")
          : "—"}
      </td>
    </tr>
  );
}

export default function AdminSellersTable({
  sellers,
}: IAdminSellersTableProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <TableHeader />

        <tbody>
          {sellers.map((seller, index) => (
            <TableRow key={seller.userId} seller={seller} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
