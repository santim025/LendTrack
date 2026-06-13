"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
      <div className="text-[12px] text-[var(--text-tertiary-new)]">
        {totalItems !== undefined && pageSize !== undefined && (
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalItems)} de {totalItems}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-[var(--text-secondary-new)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        {getVisiblePages().map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-[12px] text-[var(--text-tertiary-new)]"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`inline-flex items-center justify-center rounded-lg min-w-[32px] h-8 text-[13px] font-medium transition-colors ${
                page === currentPage
                  ? "bg-[var(--brand-500)] text-white"
                  : "text-[var(--text-secondary-new)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-[var(--text-secondary-new)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
