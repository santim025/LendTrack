"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPages(page: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

const baseBtn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-sm)] border px-2.5 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = getPages(page, totalPages);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
        className={`${baseBtn} border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary-new)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]`}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-9 min-w-9 items-center justify-center text-[13px] text-[var(--text-tertiary-new)]"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={
              p === page
                ? `${baseBtn} border-[var(--brand-500)] bg-[var(--brand-500)] text-white`
                : `${baseBtn} border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary-new)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]`
            }
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Página siguiente"
        className={`${baseBtn} border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary-new)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]`}
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </nav>
  );
}
