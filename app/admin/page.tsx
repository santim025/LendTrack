"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, ShieldCheck } from "lucide-react";
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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-[#0F6E56]" strokeWidth={2} />
          <h1 className="text-lg font-semibold text-foreground">Administración</h1>
        </div>
        <p className="text-[13px] text-secondary mb-5">
          {users.length} usuario(s). Revisa el último acceso para identificar cuentas inactivas o spam.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-[#FBEBE3] px-3 py-2.5 text-[13px] font-medium text-[#993C1D]">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-secondary text-sm">Cargando…</p>
        ) : (
          <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-card overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 720 }}>
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-secondary">
                  <th className="px-3 py-3 font-semibold border-b border-[rgba(0,0,0,0.08)]">Correo</th>
                  <th className="px-3 py-3 font-semibold border-b border-[rgba(0,0,0,0.08)]">Rol</th>
                  <th className="px-3 py-3 font-semibold border-b border-[rgba(0,0,0,0.08)]">Último acceso</th>
                  <th className="px-3 py-3 font-semibold border-b border-[rgba(0,0,0,0.08)]">Registrado</th>
                  <th className="px-3 py-3 font-semibold border-b border-[rgba(0,0,0,0.08)] text-center">Datos</th>
                  <th className="px-3 py-3 font-semibold border-b border-[rgba(0,0,0,0.08)] text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const inactivo = !u.lastLogin && u.clients === 0 && u.loans === 0;
                  return (
                    <tr key={u.id} className={inactivo ? "bg-[#FFFBF8]" : undefined}>
                      <td className="px-3 py-3 text-[13px] text-foreground border-b border-[rgba(0,0,0,0.06)] whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="px-3 py-3 border-b border-[rgba(0,0,0,0.06)] whitespace-nowrap">
                        {u.role === "admin" ? (
                          <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F6E56]">
                            admin
                          </span>
                        ) : (
                          <span className="text-[12px] text-secondary">usuario</span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-3 text-[13px] border-b border-[rgba(0,0,0,0.06)] whitespace-nowrap ${
                          u.lastLogin ? "text-foreground" : "text-[#993C1D]"
                        }`}
                      >
                        {fmtDate(u.lastLogin)}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-secondary border-b border-[rgba(0,0,0,0.06)] whitespace-nowrap">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-[12px] text-secondary border-b border-[rgba(0,0,0,0.06)] text-center whitespace-nowrap">
                        {u.clients} cli · {u.loans} pré · {u.payments} pag
                      </td>
                      <td className="px-3 py-3 border-b border-[rgba(0,0,0,0.06)] text-right whitespace-nowrap">
                        {u.role === "admin" ? (
                          <span className="text-[12px] text-secondary">—</span>
                        ) : (
                          <button
                            onClick={() => setConfirmUser(u)}
                            disabled={deletingId === u.id}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#993C1D] hover:opacity-80 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            {deletingId === u.id ? "Eliminando…" : "Eliminar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[13px] text-secondary">
                      No hay usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal de confirmación */}
      {confirmUser && (
        <div
          onClick={() => setConfirmUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(26,32,44,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FBEBE3] text-[#993C1D]">
              <Trash2 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">Eliminar usuario</h3>
            <p className="mb-6 text-[13.5px] leading-relaxed text-secondary">
              ¿Seguro que quieres eliminar a{" "}
              <strong className="text-foreground">{confirmUser.email}</strong> y todos sus datos
              ({confirmUser.clients} cliente(s), {confirmUser.loans} préstamo(s),{" "}
              {confirmUser.payments} pago(s))? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setConfirmUser(null)}
                className="h-10 rounded-lg border border-[rgba(0,0,0,0.15)] bg-card px-4 text-[13.5px] font-medium text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#993C1D] px-4 text-[13.5px] font-medium text-white"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
