import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "emerald" | "red" | "blue" | "amber" | "neutral";

const toneStyles: Record<StatTone, { bg: string; fg: string }> = {
  emerald: { bg: "bg-[var(--brand-50)]", fg: "text-[var(--brand-500)]" },
  red: { bg: "bg-[var(--danger-50)]", fg: "text-[var(--danger-500)]" },
  blue: { bg: "bg-[var(--info-50)]", fg: "text-[var(--info-500)]" },
  amber: { bg: "bg-[var(--warning-50)]", fg: "text-[var(--warning-500)]" },
  neutral: { bg: "bg-[var(--ink-50)]", fg: "text-[var(--ink-500)]" },
};

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: StatTone;
  highlight?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = "neutral",
  highlight = false,
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]",
        highlight && "bg-[var(--brand-500)] text-white",
        className
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex items-center justify-center rounded-full",
            styles.bg,
            styles.fg,
            highlight && "bg-white/20 text-white"
          )}
          style={{ width: 40, height: 40 }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4">
        <p
          className={cn(
            "text-[12px] font-medium uppercase tracking-wider",
            highlight ? "text-white/70" : "text-[var(--text-tertiary-new)]"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "tabular-nums mt-1 font-display",
            highlight ? "text-white" : "text-[var(--text-primary)]"
          )}
          style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          {value}
        </p>
        {subtitle ? (
          <p
            className={cn(
              "mt-1 text-[11px]",
              highlight ? "text-white/60" : "text-[var(--text-tertiary-new)]"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
