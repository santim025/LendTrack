"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoanEditForm } from "@/components/loans/loan-edit-form";
import {
  ChevronRight,
  Calendar,
  Percent,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Pencil,
} from "lucide-react";

interface Loan {
  id: string;
  principalAmount: number;
  interestRate: number;
  monthlyInterest: number;
  startDate: string;
  paymentFrequencyDays: number;
  status: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  number: number;
  paymentMonth: string;
  interestEarned: number;
  wasPaid: boolean;
  paymentDate: string | null;
  isOverdue: boolean;
  isCurrent: boolean;
}

interface Summary {
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  totalPaid: number;
  totalInterest: number;
  totalToReceive: number;
  progress: number;
  nextPaymentDate: string | null;
  hasOverdue: boolean;
}

interface LoanDetail {
  loan: Loan;
  client: Client;
  payments: Payment[];
  summary: Summary;
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function LoanDetailPage() {
  const params = useParams();
  const [data, setData] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchLoan = async () => {
    try {
      const response = await fetch(`/api/loans/${params.id}`);
      if (!response.ok) throw new Error("Error fetching loan");
      const loanData = await response.json();
      setData(loanData);
    } catch (error) {
      console.error("Error fetching loan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [params.id]);

  const handleMarkAsPaid = async (paymentId: string) => {
    setMarkingPaid(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wasPaid: true }),
      });

      if (!response.ok) throw new Error("Error marking payment as paid");
      await fetchLoan();
    } catch (error) {
      console.error("Error marking payment as paid:", error);
    } finally {
      setMarkingPaid(null);
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchLoan();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Cargando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Préstamo no encontrado</p>
      </div>
    );
  }

  const { loan, client, payments, summary } = data;
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const daysToNext = summary.nextPaymentDate ? daysUntil(summary.nextPaymentDate) : null;

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 mb-6 text-[13px] flex-wrap">
          <Link href="/prestamos" className="text-[var(--text-secondary-new)] hover:text-[var(--brand-500)] transition-colors">
            Préstamos
          </Link>
          <ChevronRight className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={2} />
          <Link href={`/clientes/${client.id}`} className="text-[var(--text-secondary-new)] hover:text-[var(--brand-500)] transition-colors">
            {client.name}
          </Link>
          <ChevronRight className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={2} />
          <span className="text-[var(--text-primary)] font-medium">Préstamo</span>
        </nav>

        <div
          className="rounded-[var(--radius-xl)] bg-[var(--surface-1)] p-6 sm:p-8 mb-6"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-8 items-center">
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-tertiary-new)] uppercase tracking-wider mb-2">
                Préstamo
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]"
                  style={{ width: 44, height: 44, fontSize: 14, fontWeight: 600 }}
                >
                  {initials}
                </div>
                <div>
                  <Link href={`/clientes/${client.id}`} className="font-display text-[20px] font-bold text-[var(--text-primary)] hover:text-[var(--brand-500)] transition-colors">
                    {client.name}
                  </Link>
                  <p className="text-[12px] text-[var(--brand-500)]">
                    <Link href={`/clientes/${client.id}`}>Ver perfil del cliente</Link>
                  </p>
                </div>
              </div>
              <div className="font-display text-[32px] sm:text-[40px] font-extrabold text-[var(--text-primary)] leading-none mb-2" style={{ letterSpacing: "-0.02em" }}>
                {formatCOP(loan.principalAmount)}
              </div>
              <p className="text-[13px] text-[var(--text-secondary-new)]">
                Cuota mensual de <span className="text-[var(--brand-500)] font-semibold">{formatCOP(loan.monthlyInterest)}</span> (interés {loan.interestRate}%)
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <ProgressRing percentage={summary.progress} size={140} strokeWidth={10} />
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${
                summary.hasOverdue
                  ? "bg-[var(--danger-50)] text-[var(--danger-500)]"
                  : loan.status === "active"
                  ? "bg-[var(--brand-50)] text-[var(--brand-500)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary-new)]"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  summary.hasOverdue
                    ? "bg-[var(--danger-500)]"
                    : loan.status === "active"
                    ? "bg-[var(--brand-500)]"
                    : "bg-[var(--text-tertiary-new)]"
                }`} />
                {summary.hasOverdue ? "Con mora" : loan.status === "active" ? "Activo" : "Completado"}
              </span>
              {loan.status === "active" && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2 text-[12px] text-[var(--text-secondary-new)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      Editar préstamo
                    </button>
                  </DialogTrigger>
                  <DialogContent className="w-[90%] sm:w-full rounded-xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-[16px] font-display" style={{ fontWeight: 600 }}>
                        Editar Préstamo
                      </DialogTitle>
                    </DialogHeader>
                    <LoanEditForm
                      loanId={loan.id}
                      currentInterestRate={loan.interestRate}
                      currentFrequency={loan.paymentFrequencyDays}
                      currentPrincipal={loan.principalAmount}
                      onSuccess={handleEditSuccess}
                      onClose={() => setIsEditDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)] mb-2">Tasa de Interés</p>
            <p className="font-display text-[18px] font-bold text-[var(--text-primary)]">{loan.interestRate}% mensual</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">{formatCOP(loan.monthlyInterest)}/mes</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)] mb-2">Fecha de Inicio</p>
            <p className="font-display text-[18px] font-bold text-[var(--text-primary)]">{formatDate(loan.startDate)}</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">Cada {loan.paymentFrequencyDays} días</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)] mb-2">Total a Recibir</p>
            <p className="font-display text-[18px] font-bold text-[var(--brand-500)]">{formatCOP(summary.totalToReceive)}</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">Capital + {formatCOP(summary.totalInterest)} intereses</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)] mb-2">Próxima Cuota</p>
            <p className={`font-display text-[18px] font-bold ${
              daysToNext !== null && daysToNext < 0
                ? "text-[var(--danger-500)]"
                : daysToNext !== null && daysToNext <= 3
                ? "text-[var(--warning-500)]"
                : "text-[var(--text-primary)]"
            }`}>
              {summary.nextPaymentDate ? formatDate(summary.nextPaymentDate) : "—"}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">
              {daysToNext !== null
                ? daysToNext < 0
                  ? `Vencida hace ${Math.abs(daysToNext)} días`
                  : daysToNext === 0
                  ? "Vence hoy"
                  : `Faltan ${daysToNext} días`
                : "Sin cuotas pendientes"}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">Tabla de Amortización</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-2)]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Cuota</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Vencimiento</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Interés</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Fecha Pago</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`border-t border-[var(--border-subtle)] transition-colors ${
                      payment.isCurrent
                        ? "bg-[var(--brand-50)]"
                        : payment.isOverdue
                        ? "bg-[var(--danger-50)]"
                        : payment.wasPaid
                        ? "opacity-60"
                        : "hover:bg-[var(--surface-0)]"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <span className={`text-[13px] ${payment.isCurrent ? "font-semibold" : "font-medium"} text-[var(--text-primary)]`}>
                        #{payment.number}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[13px] ${payment.isCurrent || payment.isOverdue ? "font-medium" : ""} text-[var(--text-primary)]`}>
                        {formatDate(payment.paymentMonth)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-display text-[13px] font-semibold ${
                        payment.isCurrent ? "text-[var(--brand-500)]" : "text-[var(--text-primary)]"
                      }`}>
                        {formatCOP(payment.interestEarned)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {payment.wasPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--brand-50)] text-[var(--brand-500)]">
                          <CheckCircle className="h-3 w-3" strokeWidth={2} />
                          Pagada
                        </span>
                      ) : payment.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--danger-50)] text-[var(--danger-500)]">
                          <AlertCircle className="h-3 w-3" strokeWidth={2} />
                          Mora
                        </span>
                      ) : payment.isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--brand-50)] text-[var(--brand-600)]">
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary-new)]">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-[var(--text-secondary-new)]">
                        {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {!payment.wasPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(payment.id)}
                          disabled={markingPaid === payment.id}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--brand-500)] hover:bg-[var(--brand-50)] hover:border-[var(--brand-200)] transition-colors disabled:opacity-60"
                        >
                          {markingPaid === payment.id ? "..." : "Marcar pagada"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
