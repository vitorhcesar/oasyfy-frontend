import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { homePathForRole } from "@/presentation/components/auth/auth-paths";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { cn } from "@/presentation/utils/cn";
import { Search, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { DOCS_NAV, docsHref, findDocsGroup } from "./docs-nav";
import type { IDocsPage } from "./docs-pages";

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
        method === "GET"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-sky-500/15 text-sky-400",
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

  const goDashboard = () => {
    if (isAuthenticated && role) {
      navigate(homePathForRole(role));
      return;
    }
    navigate("/login");
  };

  return (
    <div className="dark min-h-screen bg-[#0b0d12] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d12]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
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

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        <nav className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24 space-y-6">
            {DOCS_NAV.map((section) => (
              <div key={section.id}>
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = item.slug === slug;
                    return (
                      <Link
                        key={item.slug || "intro"}
                        to={docsHref(item.slug)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                          active
                            ? "bg-emerald-500/15 font-medium text-emerald-400"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                        )}
                      >
                        {item.method && <MethodBadge method={item.method} />}
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          {group && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {group.title}
            </p>
          )}
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">
            {page.title}
          </h1>
          <p className="mb-8 text-zinc-400">{page.summary}</p>
          {children}
        </main>

        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24">
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
          </div>
        </aside>
      </div>
    </div>
  );
}
