"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import {
  Download,
  Mail,
  Loader2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Send,
  Info,
} from "lucide-react";

type Feedback =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

function currentMonth(offset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export default function ConsolidadoPage() {
  const [fromMonth, setFromMonth] = useState(currentMonth(-2));
  const [toMonth, setToMonth] = useState(currentMonth(0));
  const [recipient, setRecipient] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const rangeValid = useMemo(() => {
    if (!fromMonth || !toMonth) return false;
    return fromMonth <= toMonth;
  }, [fromMonth, toMonth]);

  const handleDownload = async () => {
    setFeedback(null);
    if (!rangeValid) {
      setFeedback({
        kind: "error",
        message: "El mes inicial no puede ser mayor al final.",
      });
      return;
    }
    setIsDownloading(true);
    try {
      const res = await fetch(
        `/api/reports/consolidated/pdf?from=${fromMonth}&to=${toMonth}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo generar el PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lendtrack-consolidado-${fromMonth}_a_${toMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setFeedback({
        kind: "success",
        message: "PDF descargado correctamente.",
      });
    } catch (err: any) {
      setFeedback({
        kind: "error",
        message: err?.message || "Error al generar el PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!rangeValid) {
      setFeedback({
        kind: "error",
        message: "El mes inicial no puede ser mayor al final.",
      });
      return;
    }
    if (!recipient) {
      setFeedback({
        kind: "error",
        message: "Ingresa un correo destinatario.",
      });
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/reports/consolidated/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromMonth,
          to: toMonth,
          recipient,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el correo");
      }
      setFeedback({
        kind: "success",
        message: `Consolidado enviado a ${recipient}.`,
      });
    } catch (err: any) {
      setFeedback({
        kind: "error",
        message: err?.message || "Error al enviar el correo.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <PageHeader
            title="Consolidado"
            subtitle="Genera reportes profesionales de tus pagos"
          />
        </div>

        <div
          className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden mb-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-start gap-4 px-6 py-5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-500)] flex-shrink-0" style={{ width: 44, height: 44 }}>
              <FileText className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-display text-[16px] font-semibold text-[var(--text-primary)]">
                Reporte de pagos por periodo
              </h2>
              <p className="text-[13px] text-[var(--text-secondary-new)] mt-1">
                Genera un PDF profesional con los pagos realizados en el
                rango de meses seleccionado. Lo puedes descargar o enviarlo
                por correo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSend} className="p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="from" className="form-label flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                  Desde mes
                </label>
                <Input
                  id="from"
                  type="month"
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="to" className="form-label flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                  Hasta mes
                </label>
                <Input
                  id="to"
                  type="month"
                  value={toMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="recipient" className="form-label flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                Enviar a
              </label>
              <Input
                id="recipient"
                type="email"
                placeholder="nombre@correo.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <p className="text-[11px] text-[var(--text-tertiary-new)]">
                Solo necesario si vas a enviar por correo.
              </p>
            </div>

            {feedback && (
              <div
                className={`flex items-start gap-2 rounded-lg px-4 py-3 text-[13px] ${
                  feedback.kind === "success"
                    ? "bg-[var(--brand-50)] text-[var(--brand-600)]"
                    : "bg-[var(--danger-50)] text-[var(--danger-500)]"
                }`}
              >
                {feedback.kind === "success" ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || isSending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-5 py-2.5 text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Download className="h-4 w-4" strokeWidth={2} />
                )}
                {isDownloading ? "Generando..." : "Descargar PDF"}
              </button>

              <button
                type="submit"
                disabled={isSending || isDownloading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-500)] px-5 py-2.5 text-[13px] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Mail className="h-4 w-4" strokeWidth={2} />
                )}
                {isSending ? "Enviando..." : "Enviar por correo"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)] flex-shrink-0" style={{ width: 32, height: 32 }}>
              <Info className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-display text-[14px] font-semibold text-[var(--text-primary)] mb-3">
                ¿Qué incluye el consolidado?
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-[13px] text-[var(--text-secondary-new)] leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-1.5 flex-shrink-0" />
                  <span>Todos los pagos marcados como realizados dentro del rango.</span>
                </li>
                <li className="flex items-start gap-2 text-[13px] text-[var(--text-secondary-new)] leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-1.5 flex-shrink-0" />
                  <span>Cliente, mes, fecha de pago, tasa de interés, monto prestado y monto del interés cobrado.</span>
                </li>
                <li className="flex items-start gap-2 text-[13px] text-[var(--text-secondary-new)] leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-1.5 flex-shrink-0" />
                  <span>Totales: dinero cobrado, cantidad de pagos y clientes involucrados.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
