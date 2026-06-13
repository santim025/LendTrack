"use client";

import type React from "react";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--surface-0)]">
      <AuthBrandPanel
        title="Gestiona tus préstamos con inteligencia"
        subtitle="Controla capital, clientes y pagos en un solo lugar. Decisiones basadas en datos reales."
        stats={[
          { value: "98%", label: "Cobranza" },
          { value: "24/7", label: "Acceso" },
          { value: "0", label: "Comisiones" },
        ]}
      />

      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 animate-in stagger-1">
            <h1 className="font-display text-[26px] font-bold text-[var(--text-primary)]">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary-new)]">
              Ingresa tus credenciales para acceder a tu panel
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--danger-50)] px-4 py-3 text-[13px] font-medium text-[var(--danger-600)] animate-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-5 animate-in stagger-2">
              <label htmlFor="email" className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-[46px] w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-subtle)] bg-[var(--surface-1)] pl-11 pr-4 text-[14px] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-tertiary-new)] hover:border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:ring-[3px] focus:ring-[var(--brand-50)] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mb-5 animate-in stagger-3">
              <label htmlFor="password" className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-tertiary-new)]" strokeWidth={1.75} />
                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-[46px] w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-subtle)] bg-[var(--surface-1)] pl-11 pr-4 text-[14px] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-tertiary-new)] hover:border-[var(--border-strong)] focus:border-[var(--brand-500)] focus:ring-[3px] focus:ring-[var(--brand-50)] disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-[46px] w-full rounded-[var(--radius-md)] bg-[var(--brand-500)] text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-[var(--brand-600)] hover:shadow-[var(--shadow-md)] active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 animate-in stagger-4"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 text-center text-[14px] text-[var(--text-secondary-new)] animate-in stagger-5">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="font-semibold text-[var(--brand-500)] hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
