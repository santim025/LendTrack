"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Phone, MapPin, Calendar, ChevronRight, DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  createdAt: string;
}

interface Loan {
  id: string;
  principalAmount: number;
  interestRate: number;
  monthlyInterest: number;
  totalPayments: number;
  paidPayments: number;
  totalPaid: number;
  progress: number;
  status: string;
  startDate: string;
}

interface Activity {
  id: string;
  type: "payment" | "loan" | "client";
  description: string;
  amount?: number;
  timestamp: string;
}

interface Stats {
  totalLent: number;
  totalPaid: number;
  totalPending: number;
  totalInterest: number;
  activeLoansCount: number;
  paidPaymentsCount: number;
  pendingPaymentsCount: number;
}

interface ClientDetail {
  client: Client;
  loans: Loan[];
  stats: Stats;
  activities: Activity[];
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}

export default function ClientDetailPage() {
  const params = useParams();
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/clients/${params.id}`);
        if (!response.ok) throw new Error("Error fetching client");
        const clientData = await response.json();
        setData(clientData);
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [params.id]);

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
        <p className="text-[var(--text-secondary-new)] text-sm">Cliente no encontrado</p>
      </div>
    );
  }

  const { client, loans, stats, activities } = data;
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 mb-6 text-[13px]">
          <Link href="/clientes" className="text-[var(--text-secondary-new)] hover:text-[var(--brand-500)] transition-colors">
            Clientes
          </Link>
          <ChevronRight className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={2} />
          <span className="text-[var(--text-primary)] font-medium">{client.name}</span>
        </nav>

        <div
          className="rounded-[var(--radius-xl)] bg-[var(--surface-1)] p-6 sm:p-8 mb-6 relative overflow-hidden"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-300)]" />

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div
              className="flex items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-100)] to-[var(--brand-50)] text-[var(--brand-600)] flex-shrink-0"
              style={{ width: 80, height: 80, fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}
            >
              {initials}
            </div>

            <div className="flex-1">
              <h1
                className="font-display text-[var(--text-primary)]"
                style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}
              >
                {client.name}
              </h1>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
                  <Phone className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                  {client.phoneNumber}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
                  <MapPin className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                  {client.address}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
                  <Calendar className="h-4 w-4 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                  Cliente desde {formatDate(client.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/prestamos/nuevo?clientId=${client.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)]"
                style={{ fontWeight: 600 }}
              >
                <span className="text-base leading-none">+</span>
                Nuevo Préstamo
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)]">Total Prestado</p>
            <p className="font-display text-[20px] font-bold text-[var(--brand-500)] mt-1">{formatCOP(stats.totalLent)}</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">{stats.activeLoansCount} préstamo{stats.activeLoansCount !== 1 ? "s" : ""} activo{stats.activeLoansCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)]">Total Pagado</p>
            <p className="font-display text-[20px] font-bold text-[var(--text-primary)] mt-1">{formatCOP(stats.totalPaid)}</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">{stats.paidPaymentsCount} cuota{stats.paidPaymentsCount !== 1 ? "s" : ""} pagada{stats.paidPaymentsCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)]">Saldo Pendiente</p>
            <p className="font-display text-[20px] font-bold text-[var(--danger-500)] mt-1">{formatCOP(stats.totalPending)}</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">{stats.pendingPaymentsCount} cuota{stats.pendingPaymentsCount !== 1 ? "s" : ""} restante{stats.pendingPaymentsCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary-new)]">Interés Generado</p>
            <p className="font-display text-[20px] font-bold text-[var(--brand-500)] mt-1">{formatCOP(stats.totalInterest)}</p>
            <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">Total esperado</p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden mb-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">Préstamos</h2>
            <Link
              href={`/prestamos/nuevo?clientId=${client.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-[var(--brand-600)]"
              style={{ fontWeight: 600 }}
            >
              <span className="text-sm leading-none">+</span>
              Nuevo
            </Link>
          </div>

          {loans.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-[var(--text-tertiary-new)]">Este cliente no tiene préstamos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--surface-2)]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Préstamo</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Monto</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Interés</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Cuota/mes</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Progreso</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Estado</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, index) => (
                    <tr key={loan.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-0)] transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/prestamos/${loan.id}`} className="text-[13px] font-medium text-[var(--brand-500)] hover:underline">
                          #{String(index + 1).padStart(3, "0")}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
                          {formatCOP(loan.principalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[var(--text-secondary-new)]">{loan.interestRate}%</td>
                      <td className="px-5 py-4">
                        <span className="font-display text-[13px] font-medium text-[var(--text-primary)]">
                          {formatCOP(loan.monthlyInterest)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-[var(--surface-3)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${loan.status === "overdue" ? "bg-[var(--danger-500)]" : "bg-[var(--brand-500)]"}`}
                              style={{ width: `${loan.progress}%` }}
                            />
                          </div>
                          <span className={`text-[11px] ${loan.status === "overdue" ? "text-[var(--danger-500)]" : "text-[var(--text-secondary-new)]"}`}>
                            {loan.paidPayments}/{loan.totalPayments}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          loan.status === "overdue"
                            ? "bg-[var(--danger-50)] text-[var(--danger-500)]"
                            : loan.status === "active"
                            ? "bg-[var(--brand-50)] text-[var(--brand-500)]"
                            : "bg-[var(--surface-2)] text-[var(--text-secondary-new)]"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            loan.status === "overdue"
                              ? "bg-[var(--danger-500)]"
                              : loan.status === "active"
                              ? "bg-[var(--brand-500)]"
                              : "bg-[var(--text-tertiary-new)]"
                          }`} />
                          {loan.status === "overdue" ? "Mora" : loan.status === "active" ? "Activo" : "Completado"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/prestamos/${loan.id}`} className="text-[13px] font-medium text-[var(--brand-500)] hover:underline">
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-subtle)]">
            <TrendingUp className="h-4 w-4 text-[var(--brand-500)]" strokeWidth={2} />
            <h2 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">Actividad Reciente</h2>
          </div>

          {activities.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-[var(--text-tertiary-new)]">No hay actividad registrada</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)] flex-shrink-0" style={{ width: 32, height: 32 }}>
                    <CheckCircle className="h-4 w-4" strokeWidth={2} />
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
                    <span className="text-[13px] font-semibold tabular-nums text-[var(--brand-500)] flex-shrink-0">
                      +{formatCOP(activity.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
