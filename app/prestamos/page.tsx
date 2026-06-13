"use client";

import { useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoanForm } from "@/components/loans/loan-form";
import { LoanCard } from "@/components/loans/loan-card";
import { HandCoins, Plus } from "lucide-react";

interface Loan {
  id: string;
  client_id: string;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
  payment_frequency_days: number;
  status: string;
  clients: {
    name: string;
    id: string;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
  };
}

export default function PrestamosPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await fetch("/api/loans");
      if (!response.ok) throw new Error("Error fetching loans");
      const data = await response.json();
      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanAdded = () => {
    setIsDialogOpen(false);
    fetchLoans();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary-new)] text-sm">Cargando...</p>
      </div>
    );
  }

  const activeLoans = loans.filter((l) => l.status === "active");
  const completedLoans = loans.filter((l) => l.status === "completed");

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <PageHeader
            title="Préstamos"
            subtitle={`${activeLoans.length} activo${activeLoans.length !== 1 ? "s" : ""} · ${completedLoans.length} completado${completedLoans.length !== 1 ? "s" : ""}`}
            action={
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)]"
                    style={{ fontWeight: 600 }}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Nuevo Préstamo
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[90%] sm:w-full rounded-xl max-w-lg">
                  <DialogHeader>
                    <DialogTitle
                      className="text-[16px] font-display"
                      style={{ fontWeight: 600 }}
                    >
                      Nuevo Préstamo
                    </DialogTitle>
                  </DialogHeader>
                  <LoanForm onSuccess={handleLoanAdded} />
                </DialogContent>
              </Dialog>
            }
          />
        </div>

        {loans.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Aún no has creado préstamos"
            description="Registra tu primer préstamo para llevar el seguimiento de intereses y pagos."
          />
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onUpdate={fetchLoans} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
