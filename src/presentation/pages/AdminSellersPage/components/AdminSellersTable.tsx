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
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${config.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-border/50">
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Seller
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ID
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
      className="animate-fade-in border-b border-border/20 last:border-0 transition-colors hover:bg-muted/20"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xs font-bold text-primary">
              {(seller.fullName || "?")
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {seller.fullName || "Sem nome"}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
        #{seller.userId}
      </td>
      <td className="px-5 py-3.5">
        <SellerStatusBadge status={seller.kycStatus} />
      </td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">
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
    <div className="admin-surface overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
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
