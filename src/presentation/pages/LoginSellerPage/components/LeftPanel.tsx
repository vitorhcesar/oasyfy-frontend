import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";

export default function LoginSellerLeftPanel() {
  return (
    <aside className="relative hidden lg:flex lg:w-[48%] xl:w-[46%] flex-col justify-between">
      <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
        <AuthBrandMark
          size="lg"
          variant="white"
          className="animate-auth-reveal-left"
        />

        <div className="max-w-md animate-auth-reveal-up [animation-delay:60ms]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Plataforma de pagamentos
          </p>
          <h1 className="mb-5 text-[2.85rem] font-bold leading-[1.08] tracking-tight text-white xl:text-[3.25rem]">
            Receba pagamentos
            <br />
            de forma simples.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/55 xl:text-lg">
            PIX instantâneo, taxas justas e um painel completo para gerenciar
            suas vendas — com a clareza de um produto de alto nível.
          </p>
        </div>

        <div className="animate-auth-reveal-up flex items-center gap-3 text-sm text-white/40 [animation-delay:120ms]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5F2998]" />
          Infraestrutura pronta para escalar
        </div>
      </div>
    </aside>
  );
}
