"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, Users, Clock, AlertTriangle, Search } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  clients: number;
  loans: number;
  payments: number;
}

function fmtDate(d: string | null) {
  if (!d) return "Nunca";
  return new Date(d).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function getInitials(email: string) {
  const parts = email.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return email.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_COLORS = ["#1E4FC4", "#7C3AED", "#E5A000", "var(--brand-500)"];

function avatarColor(user: AdminUser) {
  if (user.role === "admin") return "var(--brand-500)";
  const sum = user.email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Protección en cliente (la API también lo exige en el servidor)
  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (role !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        if (res.status === 401) return router.replace("/auth/login");
        if (res.status === 403) return router.replace("/dashboard");
        throw new Error("Error al cargar usuarios");
      }
      setUsers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = async () => {
    if (!confirmUser) return;
    const u = confirmUser;
    setConfirmUser(null);
    setDeletingId(u.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo eliminar");
      }
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const activeRecent = users.filter(
      (u) => u.lastLogin && new Date(u.lastLogin).getTime() >= dayAgo
    ).length;
    const neverLogged = users.filter((u) => !u.lastLogin).length;
    return { total, admins, regulars: total - admins, activeRecent, neverLogged };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <DashboardNav />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:pb-12">
        {/* Hero */}
        <div className="mb-8">
          <p className="mb-2 text-[13px] font-medium text-[var(--text-secondary-new)] animate-in stagger-1">
            Panel de control
          </p>
          <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[36px] animate-in stagger-2">
            Administración del{" "}
            <span className="bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-400)] bg-clip-text text-transparent">
              sistema
            </span>
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary-new)] animate-in stagger-3">
            Gestiona usuarios, revisa accesos y mantén el control total de la plataforma.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--danger-50)] px-3 py-2.5 text-[13px] font-medium text-[var(--danger-600)]">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-700)] to-[var(--brand-500)] p-5 text-white animate-in stagger-3"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-white/15">
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="font-display text-[30px] font-bold leading-[1.1]">{stats.total}</p>
            <p className="mt-1 text-[13px] font-medium text-white/70">Total de usuarios</p>
            <p className="mt-2 text-[11px] text-white/50">
              {stats.admins} administrador(es) · {stats.regulars} usuario(s)
            </p>
          </div>

          <StatCard
            accent="var(--info-500)"
            iconBg="var(--info-50)"
            iconColor="var(--info-500)"
            icon={<Clock className="h-5 w-5" strokeWidth={2} />}
            value={stats.activeRecent}
            label="Activos hoy"
            subtitle="Últimas 24 horas"
            delay="stagger-4"
          />

          <StatCard
            accent="var(--warning-500)"
            iconBg="var(--warning-50)"
            iconColor="var(--warning-500)"
            icon={<AlertTriangle className="h-5 w-5" strokeWidth={2} />}
            value={stats.neverLogged}
            label="Sin acceso"
            subtitle="Nunca ha iniciado sesión"
            delay="stagger-5"
          />
        </div>

        {/* Users table */}
        <div className="mb-4 animate-in stagger-6">
          <h2 className="font-display text-[20px] font-bold text-[var(--text-primary)]">
            Usuarios registrados
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--text-secondary-new)]">
            {users.length} usuario(s) en el sistema
          </p>
        </div>

        <div
          className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] animate-in stagger-7"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5">
            <span className="font-display text-[14px] font-semibold text-[var(--text-primary)]">
              Lista de usuarios
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary-new)]" strokeWidth={2} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar usuario..."
                className="h-9 w-[180px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-2)] pl-9 pr-3 text-[13px] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-tertiary-new)] focus:border-[var(--brand-500)] focus:bg-[var(--surface-1)] focus:ring-[3px] focus:ring-[var(--brand-50)] sm:w-[240px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 680 }}>
              <thead>
                <tr className="bg-[var(--surface-2)] text-left text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary-new)]">
                  <th className="border-b border-[var(--border-subtle)] px-5 py-3 font-semibold">Usuario</th>
                  <th className="border-b border-[var(--border-subtle)] px-5 py-3 font-semibold">Rol</th>
                  <th className="border-b border-[var(--border-subtle)] px-5 py-3 font-semibold">Último acceso</th>
                  <th className="border-b border-[var(--border-subtle)] px-5 py-3 font-semibold">Registrado</th>
                  <th className="border-b border-[var(--border-subtle)] px-5 py-3 font-semibold">Datos</th>
                  <th className="border-b border-[var(--border-subtle)] px-5 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-[var(--text-secondary-new)]">
                      Cargando…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-[var(--text-secondary-new)]">
                      {users.length === 0 ? "No hay usuarios." : "Sin resultados para tu búsqueda."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-[var(--surface-2)]">
                      <td className="border-b border-[var(--border-subtle)] px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold text-white"
                            style={{ background: avatarColor(u) }}
                          >
                            {getInitials(u.email)}
                          </div>
                          <span className="text-[13px] font-medium text-[var(--text-primary)]">{u.email}</span>
                        </div>
                      </td>
                      <td className="border-b border-[var(--border-subtle)] px-5 py-4 whitespace-nowrap">
                        {u.role === "admin" ? (
                          <span className="inline-flex rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-600)]">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary-new)]">
                            Usuario
                          </span>
                        )}
                      </td>
                      <td
                        className={`border-b border-[var(--border-subtle)] px-5 py-4 text-[13px] whitespace-nowrap tabular-nums ${
                          u.lastLogin ? "text-[var(--text-secondary-new)]" : "font-medium text-[var(--danger-500)]"
                        }`}
                      >
                        {fmtDate(u.lastLogin)}
                      </td>
                      <td className="border-b border-[var(--border-subtle)] px-5 py-4 text-[13px] whitespace-nowrap tabular-nums text-[var(--text-secondary-new)]">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="border-b border-[var(--border-subtle)] px-5 py-4 text-[13px] whitespace-nowrap tabular-nums text-[var(--text-secondary-new)]">
                        {u.clients} cli · {u.loans} pré · {u.payments} pag
                      </td>
                      <td className="border-b border-[var(--border-subtle)] px-5 py-4 text-right whitespace-nowrap">
                        {u.role === "admin" ? (
                          <span className="text-[13px] text-[var(--text-tertiary-new)]">—</span>
                        ) : (
                          <button
                            onClick={() => setConfirmUser(u)}
                            disabled={deletingId === u.id}
                            aria-label={`Eliminar ${u.email}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-secondary-new)] transition-all hover:border-[var(--danger-50)] hover:bg-[var(--danger-50)] hover:text-[var(--danger-500)] disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de confirmación */}
      {confirmUser && (
        <div
          onClick={() => setConfirmUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-[var(--radius-xl)] bg-[var(--surface-1)] p-8"
            style={{ boxShadow: "var(--shadow-xl)" }}
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--danger-50)] text-[var(--danger-500)]">
              <Trash2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="mb-2 font-display text-[16px] font-bold text-[var(--text-primary)]">Eliminar usuario</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[var(--text-secondary-new)]">
              ¿Seguro que quieres eliminar a{" "}
              <strong className="text-[var(--text-primary)]">{confirmUser.email}</strong> y todos sus datos
              ({confirmUser.clients} cliente(s), {confirmUser.loans} préstamo(s),{" "}
              {confirmUser.payments} pago(s))? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmUser(null)}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-5 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--danger-500)] px-5 text-[13px] font-semibold text-white transition-all hover:bg-[var(--danger-600)] hover:shadow-[var(--shadow-md)]"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  accent: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  value: number;
  label: string;
  subtitle: string;
  delay: string;
}

function StatCard({ accent, iconBg, iconColor, icon, value, label, subtitle, delay }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] animate-in ${delay}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <p className="font-display text-[30px] font-bold leading-[1.1] text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary-new)]">{label}</p>
      <p className="mt-2 text-[11px] text-[var(--text-tertiary-new)]">{subtitle}</p>
    </div>
  );
}
