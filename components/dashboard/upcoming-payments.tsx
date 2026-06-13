"use client";

import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

interface UpcomingPayment {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  loanId: string;
}

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--brand-500)]" strokeWidth={2} />
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Próximos Pagos</h3>
        </div>
        <Link href="/pagos" className="text-[12px] font-medium text-[var(--brand-500)] hover:text-[var(--brand-600)] transition-colors">
          Ver todos
        </Link>
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {payments.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-[var(--text-tertiary-new)]">No hay pagos próximos</p>
          </div>
        ) : (
          payments.map((payment) => (
            <Link
              key={payment.id}
              href={`/prestamos/${payment.loanId}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-2)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]" style={{ width: 36, height: 36, fontSize: 12, fontWeight: 600 }}>
                  {payment.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                    {payment.clientName}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary-new)]">
                    {formatDate(payment.dueDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[14px] font-semibold tabular-nums text-[var(--text-primary)]">
                  {formatCOP(payment.amount)}
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
