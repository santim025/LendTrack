"use client";

import { useEffect, useState } from "react";
import { Wallet, HandCoins, TrendingUp, Activity } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { TopClients } from "@/components/dashboard/top-clients";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { CountUp } from "@/components/dashboard/count-up";

interface CapitalData {
  current_capital: number;
  initial_capital: number;
}

interface MonthlyData {
  month: string;
  earnings: number;
}

interface UpcomingPayment {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  loanId: string;
}

interface TopClient {
  id: string;
  name: string;
  totalLoans: number;
  totalPaid: number;
}

interface ActivityItem {
  id: string;
  type: "payment" | "loan" | "client";
  description: string;
  amount?: number;
  timestamp: string;
}

interface DashboardData {
  capital: CapitalData;
  totalLent: number;
  monthlyData: MonthlyData[];
  totalInterests: number;
  upcomingPayments: UpcomingPayment[];
  topClients: TopClient[];
  activities: ActivityItem[];
  collectionRate: number;
}

function formatCOP(value: number) {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Error fetching data");
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Cargando...</p>
      </div>
    );
  }

  const capital = data?.capital;
  const totalLent = data?.totalLent || 0;
  const monthlyData = data?.monthlyData || [];
  const totalEarnings = monthlyData.reduce((sum, m) => sum + m.earnings, 0);
  const upcomingPayments = data?.upcomingPayments || [];
  const topClients = data?.topClients || [];
  const activities = data?.activities || [];
  const collectionRate = data?.collectionRate || 0;

  const growthPercentage = capital?.initial_capital
    ? ((capital.current_capital - capital.initial_capital) /
        Math.max(capital.initial_capital, 1)) *
      100
    : 0;

  const availableCapital = (capital?.current_capital || 0) - totalLent;

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />
      <main className="flex-1">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8 animate-in stagger-1">
            <p className="text-[13px] text-[var(--text-secondary-new)] font-medium mb-2">
              Buenos días, Santiago
            </p>
            <h1 className="font-display text-[36px] sm:text-[42px] font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-[-0.02em]">
              Tu negocio de{" "}
              <span className="bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-400)] bg-clip-text text-transparent">
                prestamos
              </span>{" "}
              en orden.
            </h1>
            <p className="text-[15px] text-[var(--text-secondary-new)] mt-2">
              Tienes {upcomingPayments.length} pagos pendientes y {topClients.length} prestamos activos.
            </p>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Main Card - Capital Disponible */}
            <div className="md:row-span-2 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-700)] to-[var(--brand-500)] p-6 text-white relative overflow-hidden animate-in stagger-2" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-white/15 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
                  +{growthPercentage.toFixed(1)}%
                </div>
              </div>
              <CountUp
                value={availableCapital}
                format={formatCOP}
                delayMs={200}
                className="block font-display text-[42px] font-bold leading-[1.1] tracking-[-0.01em] mb-2"
              />
              <p className="text-[14px] font-medium text-white/80 mb-1">
                Capital Disponible
              </p>
              <p className="text-[12px] text-white/60">
                Dinero en caja para nuevos prestamos
              </p>
              {/* Sparkline placeholder */}
              <div className="mt-6 h-12 relative">
                <svg className="w-full h-full" viewBox="0 0 200 48" preserveAspectRatio="none">
                  <path
                    d="M0,40 Q20,35 40,32 T80,28 T120,20 T160,15 T200,10"
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="2"
                    pathLength={1}
                    className="animate-draw"
                  />
                  <path
                    d="M0,40 Q20,35 40,32 T80,28 T120,20 T160,15 T200,10 L200,48 L0,48 Z"
                    fill="url(#sparkline-gradient)"
                    className="animate-area"
                  />
                  <defs>
                    <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Capital Prestado */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 animate-in stagger-3" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--danger-50)] flex items-center justify-center">
                  <HandCoins className="w-5 h-5 text-[var(--danger-500)]" strokeWidth={2} />
                </div>
              </div>
              <CountUp
                value={totalLent}
                format={formatCOP}
                delayMs={260}
                className="block font-display text-[28px] font-bold text-[var(--text-primary)] leading-[1.1] tracking-[-0.01em] mb-1"
              />
              <p className="text-[13px] font-medium text-[var(--text-secondary-new)] mb-1">
                Capital Prestado
              </p>
              <p className="text-[11px] text-[var(--text-tertiary-new)]">
                En manos de {topClients.length} clientes
              </p>
            </div>

            {/* Ganancias Totales */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 animate-in stagger-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--info-50)] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[var(--info-500)]" strokeWidth={2} />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[var(--success-50)] text-[11px] font-semibold text-[var(--success-500)]">
                  +8.2%
                </div>
              </div>
              <CountUp
                value={totalEarnings}
                format={formatCOP}
                delayMs={320}
                className="block font-display text-[28px] font-bold text-[var(--text-primary)] leading-[1.1] tracking-[-0.01em] mb-1"
              />
              <p className="text-[13px] font-medium text-[var(--text-secondary-new)] mb-1">
                Ganancias Totales
              </p>
              <p className="text-[11px] text-[var(--text-tertiary-new)]">
                Intereses generados
              </p>
            </div>

            {/* Crecimiento */}
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 animate-in stagger-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--warning-50)] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[var(--warning-500)]" strokeWidth={2} />
                </div>
              </div>
              <CountUp
                value={growthPercentage}
                format={formatPercent}
                delayMs={380}
                className="block font-display text-[28px] font-bold text-[var(--text-primary)] leading-[1.1] tracking-[-0.01em] mb-1"
              />
              <p className="text-[13px] font-medium text-[var(--text-secondary-new)] mb-1">
                Crecimiento
              </p>
              <p className="text-[11px] text-[var(--text-tertiary-new)]">
                Desde capital inicial
              </p>
            </div>
          </div>

          {/* Earnings Chart + Collection Rate */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
            <div className="lg:col-span-2">
              <EarningsChart data={monthlyData} />
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 flex flex-col items-center justify-center animate-in stagger-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-4">Tasa de Cobro</h3>
              <ProgressRing percentage={collectionRate} size={140} strokeWidth={10} />
              <p className="text-[12px] text-[var(--text-tertiary-new)] mt-4 text-center">
                Porcentaje de intereses cobrados vs esperados
              </p>
            </div>
          </div>

          {/* Upcoming Payments + Top Clients */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
            <UpcomingPayments payments={upcomingPayments} />
            <TopClients clients={topClients} />
          </div>

          {/* Activity Timeline */}
          <ActivityTimeline activities={activities} />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
