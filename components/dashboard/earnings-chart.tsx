"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MonthlyData {
  month: string;
  earnings: number;
}

interface EarningsChartProps {
  data: MonthlyData[];
}

function formatShortCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

export function EarningsChart({ data }: EarningsChartProps) {
  const isMobile = useIsMobile();
  const [animate] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  return (
    <div
      className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-subtle)]">
        <TrendingUp className="h-4 w-4 text-[var(--brand-500)]" strokeWidth={2} />
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Ganancias Mensuales</h3>
      </div>
      <div className="px-2 sm:px-4 py-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-4 py-10">
            <div className="flex items-center justify-center rounded-full bg-[var(--ink-50)]" style={{ width: 48, height: 48 }}>
              <TrendingUp className="h-5 w-5 text-[var(--ink-400)]" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-[13px] font-medium text-[var(--text-primary)]">
              Aún no hay datos
            </p>
            <p className="text-[12px] text-[var(--text-tertiary-new)] mt-1 max-w-xs">
              Cuando marques pagos como realizados verás la evolución mensual aquí.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
            <AreaChart
              data={data}
              margin={isMobile ? { top: 8, right: 8, left: -16, bottom: 0 } : { top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-tertiary-new)", fontSize: isMobile ? 10 : 11 }}
                axisLine={{ stroke: "var(--border-subtle)" }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={isMobile ? 16 : 8}
              />
              <YAxis
                tick={{ fill: "var(--text-tertiary-new)", fontSize: isMobile ? 10 : 11 }}
                axisLine={{ stroke: "var(--border-subtle)" }}
                tickLine={false}
                width={isMobile ? 40 : 60}
                tickFormatter={isMobile ? formatShortCurrency : (value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString("es-CO")}`}
                contentStyle={{
                  backgroundColor: "var(--surface-1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  fontSize: 12,
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="var(--brand-500)"
                strokeWidth={2}
                fill="url(#earningsGradient)"
                name="Ganancias"
                dot={{ fill: "var(--brand-500)", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: "var(--brand-500)" }}
                isAnimationActive={animate}
                animationDuration={1400}
                animationBegin={200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
