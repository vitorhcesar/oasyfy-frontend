interface AdminKycPageHeaderProps {
  totalCount: number;
  pendingCount: number;
}

export default function AdminKycPageHeader({
  totalCount,
  pendingCount,
}: AdminKycPageHeaderProps) {
  return (
    <header className="mb-8 animate-fade-in">
      <h1 className="text-xl font-semibold text-foreground">Produtores</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {totalCount} cadastro{totalCount !== 1 ? "s" : ""}
        {pendingCount > 0 && (
          <span className="text-amber-600">
            {" "}
            · {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
      </p>
    </header>
  );
}
