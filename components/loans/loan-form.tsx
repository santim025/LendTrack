"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Percent, Calendar, Clock, User } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface LoanFormProps {
  onSuccess: () => void;
}

export function LoanForm({ onSuccess }: LoanFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    clientId: "",
    principalAmount: "",
    interestRate: "",
    startDate: new Date().toISOString().split("T")[0],
    paymentFrequencyDays: "30",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Error fetching clients");
      const data = await response.json();
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

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
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          principalAmount: parseFloat(formData.principalAmount),
          interestRate: parseFloat(formData.interestRate),
          startDate: formData.startDate,
          paymentFrequencyDays: formData.paymentFrequencyDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear préstamo");
      }

      onSuccess();
    } catch (err: any) {
      console.error("Error creating loan:", err);
      setError(err?.message || "Error al crear préstamo");
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyInterest = formData.principalAmount && formData.interestRate
    ? (parseFloat(formData.principalAmount) * parseFloat(formData.interestRate)) / 100
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="clientId" className="form-label flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Cliente
        </label>
        <Select
          value={formData.clientId}
          onValueChange={(value) => handleSelectChange("clientId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="principalAmount" className="form-label flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
          Monto del Préstamo
        </label>
        <Input
          id="principalAmount"
          name="principalAmount"
          type="number"
          placeholder="1000000"
          value={formData.principalAmount}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          step="1000"
        />
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
          placeholder="5"
          value={formData.interestRate}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          step="0.1"
        />
      </div>

      {monthlyInterest > 0 && (
        <div className="rounded-lg bg-[var(--brand-50)] border border-[var(--brand-100)] p-3">
          <p className="text-[12px] text-[var(--text-secondary-new)]">Interés mensual estimado</p>
          <p className="font-display text-[20px] font-bold text-[var(--brand-500)]">
            ${monthlyInterest.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="startDate" className="form-label flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
            Fecha de Inicio
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="paymentFrequencyDays" className="form-label flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
            Frecuencia
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
              <SelectItem value="7">Semanal</SelectItem>
              <SelectItem value="15">Quincenal</SelectItem>
              <SelectItem value="30">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--danger-50)] border border-[var(--danger-500)]/20 p-3">
          <p className="text-[12px] text-[var(--danger-500)]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-[var(--brand-500)] py-3 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-60"
        style={{ fontWeight: 600 }}
      >
        {isLoading ? "Creando..." : "Crear Préstamo"}
      </button>
    </form>
  );
}
