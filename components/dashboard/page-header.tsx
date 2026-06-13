import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1
          className="font-display text-[var(--text-primary)]"
          style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[14px] text-[var(--text-secondary-new)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2 flex-shrink-0">{action}</div> : null}
    </div>
  );
}
