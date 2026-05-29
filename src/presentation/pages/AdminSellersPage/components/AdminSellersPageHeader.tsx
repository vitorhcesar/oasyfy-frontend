export default function AdminSellersPageHeader() {
  return (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Gerenciamento
        </span>
      </div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        Sellers
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Todos os sellers cadastrados na plataforma
      </p>
    </header>
  );
}
