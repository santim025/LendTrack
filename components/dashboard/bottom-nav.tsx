"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  HandCoins,
  CreditCard,
  Wallet,
  FileText,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/prestamos", label: "Préstamos", icon: HandCoins },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/capital", label: "Capital", icon: Wallet },
  { href: "/consolidado", label: "Reporte", icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] sm:hidden"
      style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-full items-stretch justify-around">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                active ? "text-[var(--brand-500)]" : "text-[var(--text-tertiary-new)]"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              <span
                className="text-[10px]"
                style={{ fontWeight: active ? 600 : 500 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
