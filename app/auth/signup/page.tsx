"use client";

import type React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

type Strength = 0 | 1 | 2 | 3 | 4;

function getStrength(value: string): Strength {
  if (value.length === 0) return 0;
  if (value.length < 4) return 1;
  if (value.length < 6) return 2;
  if (value.length < 10) return 3;
  return 4;
}

const STRENGTH_COLORS: Record<Exclude<Strength, 0>, string> = {
  1: "var(--warning-500)",
  2: "var(--warning-500)",
  3: "#E5A000",
  4: "var(--brand-500)",
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const strength = getStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la cuenta");
      }

      router.push("/auth/signup-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "h-[46px] w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-subtle)] bg-[var(--surface-1)] pl-11 pr-4 text-[14px] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-tertiary-new)] hover:border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:ring-[3px] focus:ring-[var(--brand-50)] disabled:opacity-60";
  const iconClass =
    "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-tertiary-new)]";

  return (
    <div className="flex min-h-screen w-full bg-[var(--surface-0)]">
      <AuthBrandPanel
        title="Comienza a gestionar hoy"
        subtitle="Crea tu cuenta en menos de 30 segundos. Sin tarjetas, sin compromisos. Solo tu email y una contraseña."
        stats={[
          { value: "30s", label: "Registro" },
          { value: "100%", label: "Gratis" },
          { value: "∞", label: "Préstamos" },
        ]}
      />

      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 animate-in stagger-1">
            <h1 className="font-display text-[26px] font-bold text-[var(--text-primary)]">
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary-new)]">
              Completa los datos para comenzar a usar LendTrack
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--danger-50)] px-4 py-3 text-[13px] font-medium text-[var(--danger-600)] animate-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp}>
            <div className="mb-5 animate-in stagger-2">
              <label htmlFor="email" className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className={iconClass} strokeWidth={1.75} />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mb-5 animate-in stagger-3">
              <label htmlFor="password" className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                Contraseña
              </label>
              <div className="relative">
                <Lock className={iconClass} strokeWidth={1.75} />
                <input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
              <div className="mt-2 flex gap-1" aria-hidden>
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className="h-[3px] flex-1 rounded-sm transition-colors"
                    style={{
                      background:
                        strength >= bar
                          ? STRENGTH_COLORS[strength as Exclude<Strength, 0>]
                          : "var(--border-subtle)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mb-5 animate-in stagger-4">
              <label htmlFor="repeat-password" className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                Confirmar contraseña
              </label>
              <div className="relative">
                <ShieldCheck className={iconClass} strokeWidth={1.75} />
                <input
                  id="repeat-password"
                  type="password"
                  placeholder="Repite tu contraseña"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-[46px] w-full rounded-[var(--radius-md)] bg-[var(--brand-500)] text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-[var(--brand-600)] hover:shadow-[var(--shadow-md)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 animate-in stagger-5"
            >
              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center text-[14px] text-[var(--text-secondary-new)] animate-in stagger-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--brand-500)] hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
