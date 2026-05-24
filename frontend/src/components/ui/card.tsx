import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  number,
  title,
  count,
  subtitle,
  accent = "accent",
  action,
}: {
  number: number;
  title: string;
  count?: number;
  subtitle?: string;
  accent?: "accent" | "yearly" | "monthly" | "month";
  action?: React.ReactNode;
}) {
  const accents: Record<string, string> = {
    accent: "border-[var(--color-accent)] text-[var(--color-accent)]",
    yearly: "border-violet-500/60 text-violet-400",
    monthly: "border-amber-500/60 text-amber-400",
    month: "border-[var(--color-month)] text-[var(--color-month)]",
  };
  const titleColors: Record<string, string> = {
    accent: "text-[var(--color-text-strong)]",
    yearly: "text-violet-300",
    monthly: "text-amber-300",
    month: "text-emerald-300",
  };
  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
            accents[accent],
          )}
        >
          {number}
        </span>
        <div>
          <h2
            className={cn(
              "text-sm font-semibold",
              titleColors[accent],
            )}
          >
            {count !== undefined && (
              <span className="mr-1 opacity-80">({count})</span>
            )}
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 self-start sm:self-center">{action}</div>}
    </div>
  );
}

export function AddPlanButton({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: "yearly" | "monthly";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        tone === "yearly" &&
          "border-violet-500/50 text-violet-300 hover:bg-violet-500/10",
        tone === "monthly" &&
          "border-amber-500/50 text-amber-300 hover:bg-amber-500/10",
      )}
    >
      {label}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "yearly" | "monthly" | "month" | "success" | "warning" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--color-panel-elevated)] text-[var(--color-text)]",
    yearly: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30",
    monthly: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    month: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    success: "bg-emerald-500/15 text-emerald-300",
    warning: "bg-orange-500/15 text-orange-300",
    info: "bg-cyan-500/15 text-cyan-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
