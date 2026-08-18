interface AdminKycPageHeaderProps {
  totalCount: number;
  pendingCount: number;
}

export default function AdminKycPageHeader({
  totalCount,
  pendingCount,
}: AdminKycPageHeaderProps) {
  return (
    <header className="mb-7 animate-fade-in">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Produtores
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
        KYC
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Gerencie KYC, adquirente e contas dos sellers
        {totalCount > 0 && (
          <>
            {" "}
            · {totalCount} seller{totalCount !== 1 ? "s" : ""}
          </>
        )}
        {pendingCount > 0 && (
          <span className="text-warning">
            {" "}
            · {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
      </p>
    </header>
  );
}
