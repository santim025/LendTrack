"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  TrendingUp,
  HandCoins,
  Pencil,
  ArrowUpRight,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Capital {
  id: string;
  initialCapital: number;
}

interface Payment {
  id: string;
  payment_month: string;
  interest_earned: number;
  was_paid: boolean;
  payment_date: string | null;
  loans: {
    clients: {
      name: string;
    };
  };
}

interface Loan {
  id: string;
  principal_amount: number;
  status: string;
  clients: {
    name: string;
  };
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

const MOVEMENTS_PER_PAGE = 10;

export default function CapitalPage() {
  const [capital, setCapital] = useState<Capital | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInitialCapital, setNewInitialCapital] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [movementsPage, setMovementsPage] = useState(1);

  useEffect(() => {
    fetchCapitalData();
  }, []);

  const fetchCapitalData = async () => {
    try {
      const capitalResponse = await fetch("/api/capital");
      if (capitalResponse.ok) {
        const capitalData = await capitalResponse.json();
        setCapital(capitalData);
        setNewInitialCapital(capitalData?.initialCapital?.toString() || "0");
      }

      const paymentsResponse = await fetch("/api/payments");
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData || []);
      }

      const loansResponse = await fetch("/api/loans");
      if (loansResponse.ok) {
        const loansData = await loansResponse.json();
        setLoans(loansData || []);
      }
    } catch (error) {
      console.error("Error fetching capital data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInitialCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch("/api/capital", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialCapital: parseFloat(newInitialCapital) }),
      });

      if (!response.ok) throw new Error("Error updating capital");

      setIsDialogOpen(false);
      fetchCapitalData();
    } catch (error) {
      console.error("Error updating capital:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Cargando...</p>
      </div>
    );
  }

  const initialCapitalValue = Number(capital?.initialCapital || 0);
  const completedPayments = payments.filter((p) => p.was_paid);
  const totalInterestEarned = completedPayments.reduce(
    (sum, p) => sum + Number(p.interest_earned),
    0
  );
  const currentCapital = initialCapitalValue + totalInterestEarned;
  const growth = initialCapitalValue
    ? (totalInterestEarned / initialCapitalValue) * 100
    : 0;

  const activeLoans = loans.filter((l) => l.status === "active");
  const totalLent = activeLoans.reduce(
    (sum, l) => sum + Number(l.principal_amount),
    0
  );

  const movements = completedPayments
    .map((p) => ({
      id: p.id,
      type: "interest" as const,
      description: `Pago de ${p.loans.clients.name}`,
      amount: Number(p.interest_earned),
      date: p.payment_date || p.payment_month,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalMovements = movements.length;
  const totalMovementPages = Math.ceil(totalMovements / MOVEMENTS_PER_PAGE);
  const paginatedMovements = movements.slice(
    (movementsPage - 1) * MOVEMENTS_PER_PAGE,
    movementsPage * MOVEMENTS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <PageHeader
            title="Mi Capital"
            subtitle="Controla tu patrimonio y el crecimiento de tu negocio"
            action={
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)]"
                    style={{ fontWeight: 600 }}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                    Actualizar Capital
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[90%] sm:w-full rounded-xl">
                  <DialogHeader>
                    <DialogTitle
                      className="text-[16px] font-display"
                      style={{ fontWeight: 600 }}
                    >
                      Actualizar Capital Inicial
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleUpdateInitialCapital}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label htmlFor="capital" className="form-label block">
                        Capital Inicial
                      </label>
                      <Input
                        id="capital"
                        type="number"
                        placeholder="0"
                        value={newInitialCapital}
                        onChange={(e) => setNewInitialCapital(e.target.value)}
                        required
                        disabled={isUpdating}
                        step="1000"
                      />
                      <p className="text-[11px] text-[var(--text-tertiary-new)]">
                        Este es tu dinero inicial al comenzar a prestar. El
                        capital actual se calcula automáticamente.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full rounded-lg bg-[var(--brand-500)] py-3 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      {isUpdating ? "Actualizando..." : "Guardar"}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />
        </div>

        <div
          className="rounded-[var(--radius-xl)] overflow-hidden mb-6 relative"
          style={{
            background: "linear-gradient(135deg, var(--brand-700), var(--brand-500))",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] -translate-y-1/2 translate-x-1/4 opacity-20"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }}
          />
          <div className="relative p-6 sm:p-8">
            <p className="text-[13px] text-white/70 font-medium mb-2">Capital Actual</p>
            <p className="font-display text-[40px] sm:text-[48px] font-extrabold text-white leading-none mb-3" style={{ letterSpacing: "-0.02em" }}>
              {formatCOP(currentCapital)}
            </p>
            <span className="inline-flex items-center gap-1 bg-white/15 px-3 py-1 rounded-full text-[12px] font-semibold text-white">
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
              +{growth.toFixed(1)}% desde inicio
            </span>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
          <StatCard
            label="Capital Inicial"
            value={formatCOP(initialCapitalValue)}
            subtitle="Tu inversión inicial"
            icon={Wallet}
            tone="neutral"
          />
          <StatCard
            label="Intereses Ganados"
            value={`+${formatCOP(totalInterestEarned)}`}
            subtitle={`${completedPayments.length} cuota${completedPayments.length !== 1 ? "s" : ""} cobrada${completedPayments.length !== 1 ? "s" : ""}`}
            icon={TrendingUp}
            tone="emerald"
          />
          <StatCard
            label="Capital Prestado"
            value={formatCOP(totalLent)}
            subtitle={`En ${activeLoans.length} préstamo${activeLoans.length !== 1 ? "s" : ""} activo${activeLoans.length !== 1 ? "s" : ""}`}
            icon={HandCoins}
            tone="amber"
          />
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="font-display text-[14px] font-semibold text-[var(--text-primary)]">Movimientos Recientes</h2>
          </div>

          {movements.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-[var(--text-tertiary-new)]">Aún no hay movimientos registrados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--surface-2)]">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Tipo</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Descripción</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Fecha</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[var(--text-secondary-new)] uppercase tracking-wider">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMovements.map((movement) => (
                      <tr key={movement.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-0)] transition-colors">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--brand-50)] text-[var(--brand-600)]">
                            <TrendingUp className="h-3 w-3" strokeWidth={2} />
                            Interés
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-[var(--text-secondary-new)]">{movement.description}</td>
                        <td className="px-5 py-3 text-[13px] text-[var(--text-secondary-new)]">{formatDate(movement.date)}</td>
                        <td className="px-5 py-3">
                          <span className="font-display text-[13px] font-semibold text-[var(--brand-500)]">
                            +{formatCOP(movement.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 pb-5">
                <Pagination
                  currentPage={movementsPage}
                  totalPages={totalMovementPages}
                  onPageChange={setMovementsPage}
                  totalItems={totalMovements}
                  pageSize={MOVEMENTS_PER_PAGE}
                />
              </div>
            </>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 mt-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)] mb-3">
            ¿Qué incluye el capital?
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-3 text-[13px] text-[var(--text-secondary-new)] leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-1.5 flex-shrink-0" />
              <span><strong className="text-[var(--text-primary)] font-medium">Capital Inicial:</strong> Tu dinero al comenzar a prestar.</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[var(--text-secondary-new)] leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-1.5 flex-shrink-0" />
              <span><strong className="text-[var(--text-primary)] font-medium">Capital Actual:</strong> Tu capital inicial más todos los intereses cobrados.</span>
            </li>
            <li className="flex items-start gap-3 text-[13px] text-[var(--text-secondary-new)] leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-1.5 flex-shrink-0" />
              <span><strong className="text-[var(--text-primary)] font-medium">Crecimiento:</strong> Porcentaje de aumento desde tu capital inicial.</span>
            </li>
          </ul>
          <p className="text-[11px] text-[var(--text-tertiary-new)] mt-3">
            El capital actual se calcula automáticamente cuando marcas un pago como realizado.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
