"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, Percent, MoreVertical, CheckCircle, Trash2 } from "lucide-react";

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

interface LoanCardProps {
  loan: Loan;
  onUpdate: () => void;
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
}

export function LoanCard({ loan, onUpdate }: LoanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const monthlyInterest = (loan.principal_amount * loan.interest_rate) / 100;
  const progress = loan.payments.total > 0 
    ? Math.round((loan.payments.paid / loan.payments.total) * 100) 
    : 0;
  const initials = loan.clients.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Error deleting loan");
      } else {
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting loan:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async () => {
    setIsDeleting(true);
    try {
      const newStatus = loan.status === "active" ? "completed" : "active";
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        console.error("Error updating loan");
      } else {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating loan:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="group relative rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 transition-all hover:shadow-[var(--shadow-md)]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <Link href={`/prestamos/${loan.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)] flex-shrink-0"
            style={{ width: 44, height: 44, fontSize: 14, fontWeight: 600 }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h3
              className="font-display text-[var(--text-primary)] group-hover:text-[var(--brand-500)] transition-colors truncate"
              style={{ fontSize: 16, fontWeight: 600 }}
            >
              {loan.clients.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${
                loan.status === "active"
                  ? "bg-[var(--brand-50)] text-[var(--brand-500)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary-new)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                loan.status === "active" ? "bg-[var(--brand-500)]" : "bg-[var(--text-tertiary-new)]"
              }`} />
              {loan.status === "active" ? "Activo" : "Completado"}
            </span>
          </div>
        </Link>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-full p-1 text-[var(--text-tertiary-new)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-8 z-10 w-44 rounded-lg bg-[var(--surface-1)] py-1 shadow-lg"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <button
                onClick={() => {
                  handleStatusChange();
                  setShowMenu(false);
                }}
                disabled={isDeleting}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-60"
              >
                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                {loan.status === "active" ? "Marcar Completado" : "Reactivar"}
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--danger-500)] hover:bg-[var(--surface-2)]">
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Eliminar
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar préstamo</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que deseas eliminar el préstamo a {loan.clients.name}? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-[var(--danger-500)] hover:bg-[var(--danger-600)]"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      <Link href={`/prestamos/${loan.id}`} className="block">
        <div className="mb-3">
          <span className="font-display text-[24px] font-bold text-[var(--text-primary)]" style={{ letterSpacing: "-0.02em" }}>
            {formatCOP(loan.principal_amount)}
          </span>
          <p className="text-[11px] text-[var(--text-tertiary-new)] mt-0.5">Capital prestado</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
            <Percent className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
            <span>{loan.interest_rate}% mensual</span>
            <span className="text-[var(--brand-500)] font-medium">
              ({formatCOP(monthlyInterest)}/mes)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary-new)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
            <span>Inicio: {new Date(loan.start_date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-[var(--text-secondary-new)] uppercase tracking-wider">Progreso</span>
            <span className="text-[12px] font-semibold tabular-nums text-[var(--text-primary)]">
              {loan.payments.paid}/{loan.payments.total} cuotas
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brand-500)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <Link
          href={`/prestamos/${loan.id}`}
          className="text-[12px] font-medium text-[var(--brand-500)] hover:text-[var(--brand-600)] transition-colors"
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  );
}
