import { homePathForRole } from "@/presentation/components/auth/auth-paths";
import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { cn } from "@/presentation/utils/cn";
import { ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DOCS_NAV,
  docsHref,
  findDocsGroup,
  findDocsNeighbors,
} from "./docs-nav";
import type { IDocsPage } from "./docs-pages";
import { DocsIntegrateAiButton } from "./DocsIntegrateAiButton";

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide",
        method === "GET"
          ? "bg-[#142b1b] text-[#4ade80]"
          : "bg-[#2d1d14] text-[#f97316]",
      )}
    >
      {method}
    </span>
  );
}

export function DocsChrome({
  slug,
  page,
  onOpenSearch,
  children,
}: {
  slug: string;
  page: IDocsPage;
  onOpenSearch: () => void;
  children: ReactNode;
}) {
  const { isAuthenticated, role } = useAuthContext();
  const navigate = useNavigate();
  const group = findDocsGroup(slug);
  const { previous, next } = findDocsNeighbors(slug);

  const goDashboard = () => {
    if (isAuthenticated && role) {
      navigate(homePathForRole(role));
      return;
    }
    navigate("/login");
  };

  return (
    <div className="dark flex h-svh flex-col overflow-hidden bg-[#0b0d12] text-zinc-100">
      <header className="z-40 shrink-0 border-b border-white/10 bg-[#0b0d12]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
          <Link to="/docs" className="shrink-0">
            <AuthBrandMark size="sm" variant="white" mark="horizontal" />
          </Link>
          <button
            type="button"
            onClick={onOpenSearch}
            className="mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-left text-sm text-zinc-400"
          >
            <Search size={14} />
            <span className="flex-1">Pesquisar...</span>
            <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 text-[10px] sm:inline">
              Ctrl K
            </kbd>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goDashboard}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black"
            >
              Dashboard
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() =>
                  navigate(role === "admin" ? "/admin" : "/seller/settings")
                }
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="Configurações"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-8 px-4">
        <nav className="hidden w-60 shrink-0 overflow-y-auto overscroll-contain py-8 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] md:block">
          <div className="space-y-6">
            {DOCS_NAV.map((section) => {
              const hasEndpoints = section.items.some((item) => item.method);
              return (
                <div key={section.id}>
                  <p
                    className={cn(
                      "mb-2 px-2 font-semibold",
                      hasEndpoints
                        ? "text-sm text-white"
                        : "text-[11px] uppercase tracking-wider text-zinc-500",
                    )}
                  >
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = item.slug === slug;
                      const isEndpoint = Boolean(item.method);
                      return (
                        <Link
                          key={item.slug || "intro"}
                          to={docsHref(item.slug)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                            isEndpoint && "justify-between",
                            active
                              ? "bg-emerald-500/15 font-medium text-emerald-400"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                          )}
                        >
                          <span className="min-w-0 truncate">{item.title}</span>
                          {item.method && <MethodBadge method={item.method} />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <main
          key={slug}
          id="layout-main-scroll"
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain py-8 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] [&_p_code]:rounded [&_p_code]:bg-white/[0.06] [&_p_code]:px-1 [&_p_code]:py-0.5 [&_p_code]:font-['IBM_Plex_Mono',ui-monospace,monospace] [&_p_code]:text-[13px] [&_p_code]:text-[#d7e7f4]"
        >
          {group && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {group.title}
            </p>
          )}
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">
            {page.title}
          </h1>
          <p className="mb-4 text-zinc-400">{page.summary}</p>
          <div className="mb-8">
            <DocsIntegrateAiButton slug={slug} />
          </div>
          {children}
          {(previous || next) && (
            <nav className="mt-16 flex items-center justify-between gap-4 border-t border-white/10 pt-6 px-6">
              {previous ? (
                <Link
                  to={docsHref(previous.slug)}
                  className="inline-flex min-w-0 items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <ChevronLeft size={16} className="shrink-0" />
                  <span className="truncate">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  to={docsHref(next.slug)}
                  className="inline-flex min-w-0 items-center justify-end gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  <span className="truncate">{next.title}</span>
                  <ChevronRight size={16} className="shrink-0" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </main>

        <aside className="hidden w-48 shrink-0 overflow-y-auto overscroll-contain py-8 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Nesta página
          </p>
          <div className="space-y-1">
            {page.toc.map((entry, index) => (
              <a
                key={entry.id}
                href={`#${entry.id}`}
                className={cn(
                  "block text-sm",
                  index === 0
                    ? "text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-200",
                )}
              >
                {entry.label}
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
