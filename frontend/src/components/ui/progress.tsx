"use client";

import { cn } from "@/lib/cn";

export function ProgressRing({
  value,
  size = 88,
  stroke = 7,
  label,
  sublabel,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-panel-elevated)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[var(--color-text-strong)]">
            {value}%
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-strong)]">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[10px] text-[var(--color-muted)]">{sublabel}</span>
      )}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "accent",
  className,
}: {
  value: number;
  tone?: "accent" | "yearly" | "monthly" | "month" | "success";
  className?: string;
}) {
  const tones: Record<string, string> = {
    accent: "bg-[var(--color-accent)]",
    yearly: "bg-violet-500",
    monthly: "bg-amber-500",
    month: "bg-emerald-500",
    success: "bg-[var(--color-success)]",
  };
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-panel-elevated)]",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
