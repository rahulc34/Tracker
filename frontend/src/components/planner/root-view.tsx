"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/card";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { isCurrentYear } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import type { RootOverview } from "@/lib/types";

export function RootView({
  data,
  onAddYear,
}: {
  data: RootOverview;
  onAddYear?: () => void;
}) {
  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-strong)] md:text-2xl">
          Root Overview
        </h1>
        <p className="text-sm text-[var(--color-muted)]">Your learning timeline</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-8">
          <ProgressRing
            value={data.overallProgress}
            label="All Years Progress"
          />
          <div className="min-w-[200px] flex-1 space-y-4">
            {data.years.map((y) => {
              const isCurrent = isCurrentYear(y.yearNumber);
              return (
                <div key={y.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span
                      className={cn(
                        isCurrent
                          ? "font-semibold text-[var(--color-accent)]"
                          : "text-[var(--color-text-strong)]",
                      )}
                    >
                      {y.yearNumber}
                      {isCurrent && (
                        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
                          Now
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        isCurrent
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-muted)]",
                      )}
                    >
                      {y.progress}%
                    </span>
                  </div>
                  <ProgressBar
                    value={y.progress}
                    tone={isCurrent ? "accent" : undefined}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-center">
            <div className="rounded-lg bg-[var(--color-panel-elevated)] px-4 py-2">
              <p className="text-lg font-bold text-[var(--color-text-strong)]">
                {data.activeYearCount}
              </p>
              <p className="text-[10px] text-[var(--color-muted)]">Active years</p>
            </div>
            <div className="rounded-lg bg-[var(--color-panel-elevated)] px-4 py-2">
              <p className="text-lg font-bold text-[var(--color-text-strong)]">
                {data.completedSkillCount}/{data.totalSkillCount}
              </p>
              <p className="text-[10px] text-[var(--color-muted)]">Skills done</p>
            </div>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader number={1} title="Years" accent="accent" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.years.map((year) => {
            const isCurrent = isCurrentYear(year.yearNumber);
            return (
              <Link key={year.id} href={`/year/${year.id}`}>
                <Card
                  className={cn(
                    "group p-4 transition-colors hover:border-[var(--color-accent)]/50",
                    isCurrent &&
                      "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/30",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-lg font-bold",
                          isCurrent
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-text-strong)]",
                        )}
                      >
                        {year.yearNumber}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-[var(--color-accent)]/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                          Now
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs opacity-0 transition-opacity group-hover:opacity-100",
                        isCurrent
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-accent)]",
                      )}
                    >
                      Open →
                    </span>
                  </div>
                  <ProgressBar
                    value={year.progress}
                    tone={isCurrent ? "accent" : undefined}
                    className="mb-3"
                  />
                  <p className="text-xs text-[var(--color-muted)]">
                    {year.yearlySkillCount} yearly · {year.monthlySkillCount} monthly ·{" "}
                    {year.activeMonthCount} months
                  </p>
                </Card>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onAddYear}
            className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-4 text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Add Year</span>
          </button>
        </div>
      </section>

      <section>
        <SectionHeader number={2} title="All Years Track" accent="yearly" />
        <Card>
          {data.years.map((year) => {
            const isCurrent = isCurrentYear(year.yearNumber);
            return (
              <div
                key={year.id}
                className={cn(
                  "border-b border-[var(--color-border)] px-4 py-4 last:border-0",
                  isCurrent && "bg-[var(--color-accent)]/5",
                )}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/year/${year.id}`}
                    className={cn(
                      "text-sm font-semibold hover:text-[var(--color-accent)]",
                      isCurrent
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-strong)]",
                    )}
                  >
                    {year.yearNumber}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] font-medium uppercase tracking-wide">
                        Now
                      </span>
                    )}
                  </Link>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCurrent && "text-[var(--color-accent)]",
                    )}
                  >
                    {year.progress}%
                  </span>
                  <div className="min-w-[120px] flex-1">
                    <ProgressBar
                      value={year.progress}
                      tone={isCurrent ? "accent" : "yearly"}
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 pl-0 text-[10px] text-[var(--color-muted)]">
                  {year.monthTracks
                    .filter((m) => m.progress > 0)
                    .slice(0, 4)
                    .map((m) => (
                      <Link
                        key={m.monthId}
                        href={`/month/${m.monthId}`}
                        className="hover:text-[var(--color-accent)]"
                      >
                        M{m.monthIndex} {m.progress}%
                      </Link>
                    ))}
                </div>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
