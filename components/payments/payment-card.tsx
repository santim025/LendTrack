"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Payment {
  id: string;
  loan_id: string;
  payment_month: string;
  interest_earned: number;
  was_paid: boolean;
  payment_date: string | null;
  is_overdue: boolean;
  days_until: number;
  loans: {
    id: string;
    clients: {
      id: string;
      name: string;
    };
  };
}

interface PaymentCardProps {
  payment: Payment;
  onUpdate: () => void;
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

function formatMonth(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PaymentCard({ payment, onUpdate }: PaymentCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentToggle = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wasPaid: !payment.was_paid }),
      });
      if (!response.ok) throw new Error("Error updating payment");
      onUpdate();
    } catch (error) {
      console.error("Error toggling payment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const initials = payment.loans.clients.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isOverdue = payment.is_overdue;
  const isSoon = !payment.was_paid && !isOverdue && payment.days_until <= 3;
  const isOk = !payment.was_paid && !isOverdue && payment.days_until > 3;

  const avatarClass = payment.was_paid
    ? "bg-[var(--surface-2)] text-[var(--text-secondary-new)]"
    : isOverdue
    ? "bg-[var(--danger-50)] text-[var(--danger-500)]"
    : isSoon
    ? "bg-[var(--warning-50)] text-[var(--warning-500)]"
    : "bg-[var(--brand-50)] text-[var(--brand-500)]";

  const statusBadge = payment.was_paid ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary-new)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary-new)]" />
      Pagado
    </span>
  ) : isOverdue ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--danger-50)] text-[var(--danger-500)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger-500)]" />
      Vencido
    </span>
  ) : isSoon ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--warning-50)] text-[var(--warning-500)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning-500)]" />
      {payment.days_until} día{payment.days_until !== 1 ? "s" : ""}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--brand-50)] text-[var(--brand-500)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
      {payment.days_until} días
    </span>
  );

  return (
    <div
      className={`group relative rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden transition-all hover:shadow-[var(--shadow-md)] ${
        isOverdue ? "ring-1 ring-[var(--danger-500)]/20" : ""
      }`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {isOverdue && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--danger-500)]" />
      )}

      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
        <div
          className={`flex items-center justify-center rounded-full flex-shrink-0 ${avatarClass}`}
          style={{ width: 40, height: 40, fontSize: 12, fontWeight: 600 }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/clientes/${payment.loans.clients.id}`}
            className="text-[14px] font-medium text-[var(--text-primary)] hover:text-[var(--brand-500)] transition-colors truncate block"
          >
            {payment.loans.clients.name}
          </Link>
          <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5 truncate">
            Préstamo · {formatMonth(payment.payment_month)}
          </p>
        </div>
        {statusBadge}
      </div>

      <div className="px-5 py-4">
        <div className={`font-display text-[20px] font-bold ${
          isOverdue ? "text-[var(--danger-500)]" : "text-[var(--text-primary)]"
        }`}>
          {formatCOP(payment.interest_earned)}
        </div>
        <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">Interés mensual</p>

        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary-new)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
            <span>Vence: {formatDate(payment.payment_month)}</span>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-2 text-[12px] text-[var(--danger-500)]">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>{Math.abs(payment.days_until)} día{Math.abs(payment.days_until) !== 1 ? "s" : ""} de mora</span>
            </div>
          )}
          {!payment.was_paid && !isOverdue && (
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary-new)]">
              <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
              <span>{payment.days_until === 0 ? "Vence hoy" : payment.days_until === 1 ? "Vence mañana" : `Faltan ${payment.days_until} días`}</span>
            </div>
          )}
          {payment.was_paid && payment.payment_date && (
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary-new)]">
              <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-500)]" strokeWidth={1.75} />
              <span>Pagado el {formatDate(payment.payment_date.split("T")[0])}</span>
            </div>
          )}
        </div>
      </div>

      {!payment.was_paid && (
        <div className="px-5 pb-4">
          <button
            onClick={handlePaymentToggle}
            disabled={isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-500)] py-2.5 text-[12px] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-60"
            style={{ fontWeight: 600 }}
          >
            <CheckCircle className="h-4 w-4" strokeWidth={2} />
            {isProcessing ? "Procesando..." : "Marcar como pagado"}
          </button>
        </div>
      )}

      {payment.was_paid && (
        <div className="px-5 pb-4">
          <button
            onClick={handlePaymentToggle}
            disabled={isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] py-2.5 text-[12px] text-[var(--text-secondary-new)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
            style={{ fontWeight: 500 }}
          >
            {isProcessing ? "Procesando..." : "Revertir pago"}
          </button>
        </div>
      )}
    </div>
  );
}
