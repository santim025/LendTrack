"use client";

import { Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";

interface TopClient {
  id: string;
  name: string;
  totalLoans: number;
  totalPaid: number;
}

interface TopClientsProps {
  clients: TopClient[];
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

export function TopClients({ clients }: TopClientsProps) {
  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[var(--cream-600)]" strokeWidth={2} />
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Top Clientes</h3>
        </div>
        <Link href="/clientes" className="text-[12px] font-medium text-[var(--brand-500)] hover:text-[var(--brand-600)] transition-colors">
          Ver todos
        </Link>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {clients.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-[var(--text-tertiary-new)]">Aún no hay clientes</p>
          </div>
        ) : (
          clients.map((client, index) => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center rounded-full bg-[var(--cream-100)] text-[var(--cream-700)]" style={{ width: 36, height: 36, fontSize: 12, fontWeight: 600 }}>
                  {client.name.charAt(0).toUpperCase()}
                  {index === 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[var(--cream-500)] text-white" style={{ width: 16, height: 16, fontSize: 9, fontWeight: 700 }}>
                      1
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                    {client.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary-new)]">
                    {client.totalLoans} préstamo{client.totalLoans !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatCOP(client.totalPaid)}
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={2} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
