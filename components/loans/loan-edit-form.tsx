"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent, Clock, DollarSign } from "lucide-react";

interface LoanEditFormProps {
  loanId: string;
  currentInterestRate: number;
  currentFrequency: number;
  currentPrincipal: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function LoanEditForm({
  loanId,
  currentInterestRate,
  currentFrequency,
  currentPrincipal,
  onSuccess,
  onClose,
}: LoanEditFormProps) {
  const [formData, setFormData] = useState({
    interestRate: currentInterestRate.toString(),
    paymentFrequencyDays: currentFrequency.toString(),
    additionalCapital: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interestRate: parseFloat(formData.interestRate),
          paymentFrequencyDays: parseInt(formData.paymentFrequencyDays),
          additionalCapital: formData.additionalCapital 
            ? parseFloat(formData.additionalCapital) 
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar préstamo");
      }

      onSuccess();
    } catch (err: any) {
      console.error("Error updating loan:", err);
      setError(err?.message || "Error al actualizar préstamo");
    } finally {
      setIsLoading(false);
    }
  };

  const newMonthlyInterest = formData.interestRate && formData.additionalCapital
    ? ((currentPrincipal + parseFloat(formData.additionalCapital)) * parseFloat(formData.interestRate)) / 100
    : formData.interestRate
    ? (currentPrincipal * parseFloat(formData.interestRate)) / 100
    : (currentPrincipal * currentInterestRate) / 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg bg-[var(--surface-2)] p-4">
        <p className="text-[12px] text-[var(--text-secondary-new)] mb-1">Capital actual</p>
        <p className="font-display text-[20px] font-bold text-[var(--text-primary)]">
          ${currentPrincipal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="interestRate" className="form-label flex items-center gap-2">
          <Percent className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Tasa de Interés Mensual (%)
        </label>
        <Input
          id="interestRate"
          name="interestRate"
          type="number"
          placeholder="10"
          value={formData.interestRate}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          step="0.1"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="paymentFrequencyDays" className="form-label flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Frecuencia de Pago
        </label>
        <Select
          value={formData.paymentFrequencyDays}
          onValueChange={(value) =>
            handleSelectChange("paymentFrequencyDays", value)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Semanal (7 días)</SelectItem>
            <SelectItem value="15">Quincenal (15 días)</SelectItem>
            <SelectItem value="30">Mensual (30 días)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="additionalCapital" className="form-label flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Capital Adicional (opcional)
        </label>
        <Input
          id="additionalCapital"
          name="additionalCapital"
          type="number"
          placeholder="0"
          value={formData.additionalCapital}
          onChange={handleInputChange}
          disabled={isLoading}
          step="1000"
        />
        <p className="text-[11px] text-[var(--text-tertiary-new)]">
          Agregar más capital al préstamo existente
        </p>
      </div>

      <div className="rounded-lg bg-[var(--brand-50)] border border-[var(--brand-100)] p-3">
        <p className="text-[12px] text-[var(--text-secondary-new)]">Nueva cuota mensual</p>
        <p className="font-display text-[20px] font-bold text-[var(--brand-500)]">
          ${newMonthlyInterest.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--danger-50)] border border-[var(--danger-500)]/20 p-3">
          <p className="text-[12px] text-[var(--danger-500)]">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 rounded-lg border border-[var(--border-default)] py-3 text-[13px] text-[var(--text-secondary-new)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-[var(--brand-500)] py-3 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-60"
          style={{ fontWeight: 600 }}
        >
          {isLoading ? "Actualizando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
