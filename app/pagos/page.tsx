"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Pagination } from "@/components/dashboard/pagination";
import { PaymentCard } from "@/components/payments/payment-card";
import { Clock, CheckCircle, AlertTriangle, Users, ChevronDown } from "lucide-react";

const PAGE_SIZE = 9;

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

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, []);

  // Volver a la primera página al cambiar de pestaña o de filtro.
  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedClient]);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) throw new Error("Error fetching payments");
      const data = await response.json();
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingPayments = payments.filter((p) => !p.was_paid);
  const completedPayments = payments.filter((p) => p.was_paid);
  const overduePayments = pendingPayments.filter((p) => p.is_overdue);

  // Lista de clientes únicos para el filtro.
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    payments.forEach((p) => map.set(p.loans.clients.id, p.loans.clients.name));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [payments]);

  const matchesClient = (p: Payment) =>
    selectedClient === "all" || p.loans.clients.id === selectedClient;

  const pendingFiltered = pendingPayments.filter(matchesClient);
  const completedFiltered = completedPayments.filter(matchesClient);

  const activeList = activeTab === "pending" ? pendingFiltered : completedFiltered;
  const sortedList =
    activeTab === "pending"
      ? [...activeList].sort((a, b) => a.days_until - b.days_until)
      : [...activeList].sort(
          (a, b) =>
            new Date(b.payment_date || b.payment_month).getTime() -
            new Date(a.payment_date || a.payment_month).getTime()
        );

  const totalPages = Math.max(1, Math.ceil(sortedList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sortedList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isFiltered = selectedClient !== "all";

  const totalPending = pendingPayments.reduce(
    (sum, p) => sum + Number(p.interest_earned),
    0
  );
  const totalCompleted = completedPayments.reduce(
    (sum, p) => sum + Number(p.interest_earned),
    0
  );
  const totalOverdue = overduePayments.reduce(
    (sum, p) => sum + Number(p.interest_earned),
    0
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <PageHeader
            title="Registro de Pagos"
            subtitle="Controla los pagos pendientes y el historial completado"
          />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
          <StatCard
            label="Pagos Pendientes"
            value={formatCOP(totalPending)}
            subtitle={`${pendingPayments.length} sin procesar${overduePayments.length > 0 ? ` · ${overduePayments.length} vencido${overduePayments.length !== 1 ? "s" : ""}` : ""}`}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Pagos Completados"
            value={formatCOP(totalCompleted)}
            subtitle={`${completedPayments.length} cuota${completedPayments.length !== 1 ? "s" : ""} cobrada${completedPayments.length !== 1 ? "s" : ""}`}
            icon={CheckCircle}
            tone="emerald"
          />
          <StatCard
            label="Vencidos"
            value={formatCOP(totalOverdue)}
            subtitle={`${overduePayments.length} pago${overduePayments.length !== 1 ? "s" : ""} overdue`}
            icon={AlertTriangle}
            tone="red"
          />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)]">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === "pending"
                  ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                  : "border-transparent text-[var(--text-secondary-new)] hover:text-[var(--text-primary)]"
              }`}
            >
              Pendientes
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                activeTab === "pending"
                  ? "bg-[var(--brand-50)] text-[var(--brand-600)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary-new)]"
              }`}>
                {pendingFiltered.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === "completed"
                  ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                  : "border-transparent text-[var(--text-secondary-new)] hover:text-[var(--text-primary)]"
              }`}
            >
              Completados
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                activeTab === "completed"
                  ? "bg-[var(--brand-50)] text-[var(--brand-600)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary-new)]"
              }`}>
                {completedFiltered.length}
              </span>
            </button>
          </div>

          {clients.length > 1 && (
            <div className="relative mb-2 sm:mb-0">
              <Users className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary-new)]" strokeWidth={2} />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                aria-label="Filtrar por cliente"
                className="h-9 appearance-none rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-1)] pl-9 pr-9 font-sans text-[13px] text-[var(--text-primary)] outline-none transition-all hover:border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:ring-[3px] focus:ring-[var(--brand-50)]"
              >
                <option value="all">Todos los clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary-new)]" strokeWidth={2} />
            </div>
          )}
        </div>

        {sortedList.length === 0 ? (
          activeTab === "pending" ? (
            <EmptyState
              icon={CheckCircle}
              title={isFiltered ? "Sin pagos pendientes" : "Todo al día"}
              description={
                isFiltered
                  ? "Este cliente no tiene pagos pendientes."
                  : "No tienes pagos pendientes por procesar."
              }
            />
          ) : (
            <EmptyState
              icon={Clock}
              title="Aún sin pagos completados"
              description={
                isFiltered
                  ? "Este cliente todavía no tiene pagos cobrados."
                  : "Cuando marques pagos como realizados aparecerán aquí."
              }
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onUpdate={fetchPayments}
                />
              ))}
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
