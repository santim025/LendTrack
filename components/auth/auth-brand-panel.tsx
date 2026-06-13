interface BrandStat {
  value: string;
  label: string;
}

interface AuthBrandPanelProps {
  title: string;
  subtitle: string;
  stats: BrandStat[];
}

export function AuthBrandPanel({ title, subtitle, stats }: AuthBrandPanelProps) {
  return (
    <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden px-12 py-16 lg:flex bg-gradient-to-br from-[var(--brand-900)] via-[var(--brand-700)] to-[var(--brand-500)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[20%] -top-[40%] h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[30%] -left-[10%] h-[350px] w-[350px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-sm text-center">
        <div
          className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-white/15 bg-white/10 backdrop-blur-sm animate-in stagger-1"
        >
          <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9" aria-hidden>
            <path d="M10 36L18 24L28 28L38 14" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="38" cy="14" r="3.6" fill="white" />
            <path d="M10 40H38" stroke="white" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="font-display mb-3 text-[28px] font-bold leading-[1.2] text-white animate-in stagger-2">
          {title}
        </h2>
        <p className="mb-10 text-[15px] leading-relaxed text-white/75 animate-in stagger-3">
          {subtitle}
        </p>

        <div className="flex justify-center gap-8 animate-in stagger-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.06em] text-white/50">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
