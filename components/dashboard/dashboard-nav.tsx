"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  HandCoins,
  CreditCard,
  Wallet,
  FileText,
  ShieldCheck,
  LogOut,
  Bell,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/prestamos", label: "Préstamos", icon: HandCoins },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/capital", label: "Capital", icon: Wallet },
  { href: "/consolidado", label: "Consolidado", icon: FileText },
];

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const initials = getInitials(null, session?.user?.email);

  return (
    <>
      <div className="sm:hidden flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4" style={{ height: 52 }}>
        <Link href="/dashboard" className="flex items-center" aria-label="LendTrack">
          <img src="/logo.svg" alt="LendTrack" style={{ height: 32, width: "auto" }} />
        </Link>
        <div className="flex items-center gap-2">
          <button className="relative flex items-center justify-center rounded-full p-1.5 text-[var(--text-secondary-new)] transition-colors hover:text-[var(--text-primary)]" aria-label="Notificaciones">
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
          </button>
          <div className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]" style={{ width: 28, height: 28, fontSize: 11, fontWeight: 600 }}>
            {initials}
          </div>
        </div>
      </div>

      <nav className="hidden sm:block border-b border-[var(--border-subtle)] bg-[var(--surface-1)]" style={{ height: 56 }}>
        <div className="flex h-full items-center justify-between gap-4 px-6 max-w-7xl mx-auto">
          <Link href="/dashboard" className="flex items-center flex-shrink-0 pr-2" aria-label="LendTrack">
            <img src="/logo.svg" alt="LendTrack" style={{ height: 36, width: "auto" }} />
          </Link>

          <div className="flex items-center h-full min-w-0">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 h-full px-4 text-[13px] transition-colors border-b-2",
                    active
                      ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                      : "border-transparent text-[var(--text-secondary-new)] hover:text-[var(--text-primary)]"
                  )}
                  style={{ fontWeight: active ? 600 : 500 }}
                >
                  <item.icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "inline-flex items-center gap-2 h-full px-4 text-[13px] transition-colors border-b-2",
                  pathname === "/admin"
                    ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                    : "border-transparent text-[var(--text-secondary-new)] hover:text-[var(--text-primary)]"
                )}
                style={{ fontWeight: pathname === "/admin" ? 600 : 500 }}
              >
                <ShieldCheck className="h-4 w-4" strokeWidth={pathname === "/admin" ? 2.25 : 1.75} />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="relative flex items-center justify-center rounded-full p-2 text-[var(--text-secondary-new)] transition-colors hover:text-[var(--text-primary)]" aria-label="Notificaciones">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
            </button>
            <div className="flex items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-500)]" style={{ width: 32, height: 32, fontSize: 12, fontWeight: 600 }} title={session?.user?.email || ""}>
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1.5 text-[12px] text-[var(--text-secondary-new)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
              style={{ fontWeight: 500 }}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              Salir
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
