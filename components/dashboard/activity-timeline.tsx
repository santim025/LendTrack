"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface TimelineItem {
  id: string;
  type: "payment" | "loan" | "client";
  description: string;
  amount?: number;
  timestamp: string;
}

interface ActivityTimelineProps {
  activities: TimelineItem[];
}

const ACTIVITIES_PER_PAGE = 8;

const filters = [
  { value: "all", label: "Todos" },
  { value: "payment", label: "Pagos" },
  { value: "loan", label: "Préstamos" },
  { value: "client", label: "Clientes" },
] as const;

type FilterValue = (typeof filters)[number]["value"];

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

const typeStyles = {
  payment: { bg: "bg-[var(--brand-50)]", fg: "text-[var(--brand-500)]", label: "Pago" },
  loan: { bg: "bg-[var(--info-50)]", fg: "text-[var(--info-500)]", label: "Préstamo" },
  client: { bg: "bg-[var(--cream-100)]", fg: "text-[var(--cream-700)]", label: "Cliente" },
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  const filteredActivities =
    activeFilter === "all"
      ? activities
      : activities.filter((a) => a.type === activeFilter);

  const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ACTIVITIES_PER_PAGE,
    currentPage * ACTIVITIES_PER_PAGE
  );

  const handleFilterChange = (filter: FilterValue) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const filterCounts = {
    all: activities.length,
    payment: activities.filter((a) => a.type === "payment").length,
    loan: activities.filter((a) => a.type === "loan").length,
    client: activities.filter((a) => a.type === "client").length,
  };

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--brand-500)]" strokeWidth={2} />
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Actividad Reciente</h3>
        </div>
        <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                activeFilter === filter.value
                  ? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary-new)] hover:text-[var(--text-primary)]"
              }`}
            >
              {filter.label}
              <span className="ml-1 text-[10px] opacity-60">
                {filterCounts[filter.value]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {filteredActivities.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-[var(--text-tertiary-new)]">
              {activeFilter === "all"
                ? "No hay actividad reciente"
                : `No hay ${filters.find((f) => f.value === activeFilter)?.label.toLowerCase()} registrados`}
            </p>
          </div>
        ) : (
          paginatedActivities.map((activity) => {
            const styles = typeStyles[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3 px-5 py-3">
                <div className={`flex items-center justify-center rounded-full ${styles.bg} ${styles.fg} flex-shrink-0`} style={{ width: 32, height: 32 }}>
                  {activity.type === "payment" && <span className="text-[11px] font-bold">$</span>}
                  {activity.type === "loan" && <span className="text-[11px] font-bold">P</span>}
                  {activity.type === "client" && <span className="text-[11px] font-bold">C</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)] leading-snug">
                    {activity.description}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
                {activity.amount !== undefined && (
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)] flex-shrink-0">
                    {formatCOP(activity.amount)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {filteredActivities.length > 0 && totalPages > 1 && (
        <div className="px-5 pb-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredActivities.length}
            pageSize={ACTIVITIES_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
}
