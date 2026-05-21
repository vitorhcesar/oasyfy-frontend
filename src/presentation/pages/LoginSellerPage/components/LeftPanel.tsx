export default function LoginSellerLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between overflow-hidden bg-primary">
      <div className="relative z-10 flex flex-col justify-between h-full px-10 xl:px-14 py-10">
        {/* Top: Logo */}
        <div>
          <h2 className="text-xl font-bold text-primary-foreground tracking-tight">
            Oasyfy
          </h2>
        </div>

        {/* Center: Main copy */}
        <div className="max-w-sm">
          <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Plataforma de pagamentos
          </p>
          <h1 className="text-[2.5rem] xl:text-5xl font-bold text-primary-foreground leading-[1.1] mb-6">
            Receba pagamentos
            <br />
            de forma simples.
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
            PIX instantâneo, taxas justas e um painel completo para gerenciar
            suas vendas.
          </p>
        </div>

        {/* Bottom: Stats row */}
        <div className="flex items-center gap-8 text-primary-foreground/80">
          <div>
            <p className="text-2xl font-bold text-primary-foreground">2.5k+</p>
            <p className="text-xs text-primary-foreground/50 mt-0.5">
              Sellers ativos
            </p>
          </div>
          <div className="w-px h-8 bg-primary-foreground/15" />
          <div>
            <p className="text-2xl font-bold text-primary-foreground">99.9%</p>
            <p className="text-xs text-primary-foreground/50 mt-0.5">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
