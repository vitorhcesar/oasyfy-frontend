import { Users } from "lucide-react";

export default function AdminSellersEmptyState() {
  return (
    <div className="admin-surface px-6 py-16 text-center">
      <Users className="mx-auto mb-3 text-muted-foreground" size={24} />
      <p className="mb-1 text-base font-semibold text-foreground">
        Nenhum seller encontrado
      </p>
      <p className="text-sm text-muted-foreground">
        Nenhum seller neste filtro.
      </p>
    </div>
  );
}
