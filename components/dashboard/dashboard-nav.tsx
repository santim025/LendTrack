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
      {/* Header móvil mínimo (solo avatar + logout) */}
      <div
        className="sm:hidden flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] bg-card px-4"
        style={{ height: 52 }}
      >
        <Link href="/dashboard" className="flex items-center" aria-label="LendTrack">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="LendTrack"
            style={{ height: 32, width: "auto" }}
          />
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full bg-[#E1F5EE] text-[#0F6E56]"
            style={{ width: 28, height: 28, fontSize: 11, fontWeight: 500 }}
          >
            {initials}
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-lg border border-[rgba(0,0,0,0.12)] bg-card p-1.5 text-secondary transition-colors hover:text-foreground"
              aria-label="Administración"
            >
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-lg border border-[rgba(0,0,0,0.12)] bg-card p-1.5 text-secondary transition-colors hover:text-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <nav
      className="hidden sm:block border-b border-[rgba(0,0,0,0.08)] bg-card"
      style={{ height: 52 }}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 max-w-7xl mx-auto">
        <Link
          href="/dashboard"
          className="flex items-center flex-shrink-0 pr-2"
          aria-label="LendTrack"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="LendTrack"
            style={{ height: 36, width: "auto" }}
          />
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
                    ? "border-foreground text-foreground"
                    : "border-transparent text-secondary hover:text-foreground"
                )}
                style={{ fontWeight: active ? 500 : 400 }}
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
                  ? "border-foreground text-foreground"
                  : "border-transparent text-secondary hover:text-foreground"
              )}
              style={{ fontWeight: pathname === "/admin" ? 500 : 400 }}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={pathname === "/admin" ? 2.25 : 1.75} />
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="flex items-center justify-center rounded-full bg-[#E1F5EE] text-[#0F6E56]"
            style={{ width: 28, height: 28, fontSize: 11, fontWeight: 500 }}
            title={session?.user?.email || ""}
          >
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,0,0,0.12)] bg-card px-2.5 py-1 text-[12px] text-secondary transition-colors hover:text-foreground hover:bg-[rgba(0,0,0,0.03)]"
            style={{ fontWeight: 500 }}
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}
