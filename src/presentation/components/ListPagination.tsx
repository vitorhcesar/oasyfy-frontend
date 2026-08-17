import { cn } from "@/presentation/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface IListPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  maxButtons?: number;
  variant?: "default" | "table";
}

export default function ListPagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  maxButtons = 5,
  variant = "default",
}: IListPaginationProps) {
  if (total === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const buttons = Math.min(maxButtons, safeTotalPages);

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        variant === "table"
          ? "border-t border-border/50 px-5 py-3"
          : "mt-3",
      )}
    >
      <p
        className={cn(
          "text-muted-foreground",
          variant === "table" ? "text-sm" : "text-xs",
        )}
      >
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={cn(
            "rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-20",
            variant === "table" ? "p-1.5 hover:bg-muted" : "p-1.5",
          )}
        >
          <ChevronLeft size={variant === "table" ? 16 : 14} />
        </button>
        {Array.from({ length: buttons }, (_, i) => {
          let pageNum: number;
          if (safeTotalPages <= maxButtons) pageNum = i + 1;
          else if (page <= Math.ceil(maxButtons / 2)) pageNum = i + 1;
          else if (page >= safeTotalPages - Math.floor(maxButtons / 2)) {
            pageNum = safeTotalPages - maxButtons + 1 + i;
          } else {
            pageNum = page - Math.floor(maxButtons / 2) + i;
          }
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "rounded-md font-medium transition-colors",
                variant === "table"
                  ? "flex h-8 w-8 items-center justify-center text-sm"
                  : "h-7 w-7 text-xs",
                page === pageNum
                  ? variant === "table"
                    ? "bg-white text-[#111827] shadow-sm"
                    : "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          disabled={page >= safeTotalPages}
          className={cn(
            "rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-20",
            variant === "table" ? "p-1.5 hover:bg-muted" : "p-1.5",
          )}
        >
          <ChevronRight size={variant === "table" ? 16 : 14} />
        </button>
      </div>
    </div>
  );
}
