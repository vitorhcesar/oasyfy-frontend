import { cn } from "@/presentation/utils/cn";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DOCS_NAV, docsHref } from "./docs-nav";

export function DocsSearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = DOCS_NAV.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.title })),
    );
    if (!q) return items.slice(0, 8);
    return items.filter((item) =>
      `${item.title} ${item.keywords} ${item.group}`.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#12141a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3">
          <Search size={16} className="text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar na documentação..."
            className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-zinc-500">
              Nenhum resultado
            </li>
          )}
          {results.map((item) => (
            <li key={item.slug || "intro"}>
              <button
                type="button"
                onClick={() => {
                  navigate(docsHref(item.slug));
                  onClose();
                }}
                className={cn(
                  "flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-white/5",
                )}
              >
                <span className="text-sm text-zinc-100">{item.title}</span>
                <span className="text-xs text-zinc-500">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
