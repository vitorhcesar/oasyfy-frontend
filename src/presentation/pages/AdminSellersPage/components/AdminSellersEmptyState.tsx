import { Users } from "lucide-react";

export default function AdminSellersEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
        <Users className="text-muted-foreground/40" size={24} />
      </div>
      <p className="text-foreground font-semibold">Nenhum seller encontrado</p>
      <p className="text-sm text-muted-foreground mt-1">
        Nenhum seller neste filtro.
      </p>
    </div>
  );
}
