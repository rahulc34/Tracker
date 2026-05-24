"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  AddPlanModal,
  type AddPlanFormData,
} from "@/components/planner/add-plan-modal";
import { Card, SectionHeader, AddPlanButton } from "@/components/ui/card";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { SkillPlanRow } from "@/components/planner/skill-plan-row";
import { MONTH_SHORT } from "@/lib/constants";
import { isCurrentMonth, isCurrentYear } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import type { YearOverview } from "@/lib/types";

export function YearView({
  yearId,
  data,
}: {
  yearId: string;
  data: YearOverview;
}) {
  const queryClient = useQueryClient();
  const [modalScope, setModalScope] = useState<"yearly" | "monthly" | null>(
    null,
  );
  const currentMonthRef = useRef<HTMLAnchorElement>(null);
  const viewingCurrentYear = isCurrentYear(data.yearNumber);

  useEffect(() => {
    if (!viewingCurrentYear) return;
    currentMonthRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [viewingCurrentYear, yearId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["year-overview", yearId] });
    queryClient.invalidateQueries({ queryKey: ["root-overview"] });
  };

  const createPlan = useMutation({
    mutationFn: (input: AddPlanFormData & { scope: "yearly" | "monthly" }) => {
      const days = input.estimatedDays ? Number(input.estimatedDays) : undefined;
      return api.createPlanFull(yearId, {
        scope: input.scope,
        title: input.title.trim(),
        description: input.description.trim() || undefined,
        estimatedDays:
          days && !Number.isNaN(days) && input.scope === "monthly"
            ? days
            : undefined,
        links: input.links,
        files: input.files,
        subSkills: input.subSkills,
      });
    },
    onSuccess: () => {
      invalidate();
      setModalScope(null);
      queryClient.invalidateQueries({ queryKey: ["plan-search-index"] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to create plan");
    },
  });

  function openModal(scope: "yearly" | "monthly") {
    setModalScope(scope);
  }

  function handleSubmit(form: AddPlanFormData) {
    if (!modalScope) return;
    createPlan.mutate({ ...form, scope: modalScope });
  }

  const maxProgress = Math.max(
    ...data.monthTracks.map((m) => m.progress),
    1,
  );

  const adding = createPlan.isPending;

  return (
    <>
      <AddPlanModal
        open={modalScope !== null}
        scope={modalScope ?? "yearly"}
        saving={adding}
        onClose={() => setModalScope(null)}
        onSubmit={handleSubmit}
      />

      <div className="space-y-6 p-4 md:space-y-8 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-strong)]">
              {data.yearNumber} Overview
            </h1>
            <p className="text-sm text-[var(--color-muted)]">Year track & plans</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-end gap-8">
            <ProgressRing value={data.progress} label="Year Progress" />
            <div className="flex flex-1 items-end gap-2 overflow-x-auto pb-1">
              {data.monthTracks.map((m) => {
                const isCurrent = isCurrentMonth(data.yearNumber, m.monthIndex);
                return (
                <Link
                  key={m.id}
                  href={`/month/${m.id}`}
                  className="group flex min-w-[48px] flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      "flex h-24 w-8 items-end rounded-t transition-colors",
                      isCurrent
                        ? "bg-[var(--color-month)]/25 ring-1 ring-[var(--color-month)]/50"
                        : "bg-[var(--color-panel-elevated)]",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        isCurrent
                          ? "bg-[var(--color-month)] group-hover:bg-[var(--color-month)]/90"
                          : "bg-[var(--color-accent)] group-hover:bg-[var(--color-accent-strong)]",
                      )}
                      style={{
                        height: `${Math.max(4, (m.progress / maxProgress) * 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px]",
                      isCurrent
                        ? "font-semibold text-[var(--color-month)]"
                        : "text-[var(--color-muted)]",
                    )}
                  >
                    {MONTH_SHORT[m.monthIndex - 1]}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isCurrent
                        ? "text-[var(--color-month)]"
                        : "text-[var(--color-text)]",
                    )}
                  >
                    {m.progress}%
                  </span>
                </Link>
              );
              })}
            </div>
          </div>
        </Card>

        <section>
          <SectionHeader
            number={1}
            title="Months"
            accent="month"
            action={
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-bg)]"
              >
                <Plus size={14} />
                Add Month
              </button>
            }
          />
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.monthTracks.map((m) => {
              const isCurrent = isCurrentMonth(data.yearNumber, m.monthIndex);
              return (
              <Link
                key={m.id}
                ref={isCurrent ? currentMonthRef : undefined}
                href={`/month/${m.id}`}
              >
                <Card
                  className={cn(
                    "min-w-[100px] p-3 transition-colors hover:border-[var(--color-month)]/50",
                    isCurrent &&
                      "border-[var(--color-month)]/60 bg-[var(--color-month)]/10 ring-1 ring-[var(--color-month)]/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isCurrent
                          ? "text-[var(--color-month)]"
                          : "text-[var(--color-text-strong)]",
                      )}
                    >
                      {MONTH_SHORT[m.monthIndex - 1]}
                    </p>
                    {isCurrent && (
                      <span className="rounded bg-[var(--color-month)]/20 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[var(--color-month)]">
                        Now
                      </span>
                    )}
                  </div>
                  <ProgressBar value={m.progress} tone="month" className="my-2" />
                  <span
                    className={cn(
                      "text-[10px]",
                      isCurrent
                        ? "text-[var(--color-month)]"
                        : "text-[var(--color-accent)]",
                    )}
                  >
                    Open →
                  </span>
                </Card>
              </Link>
            );
            })}
            <Card className="flex min-w-[100px] items-center justify-center border-dashed p-3">
              <Plus size={20} className="text-[var(--color-muted)]" />
            </Card>
          </div>
        </section>

        <section id="yearly">
          <SectionHeader
            number={2}
            count={data.yearlyPlans.length}
            title="Yearly Plans"
            subtitle="Long-term goals"
            accent="yearly"
            action={
              <AddPlanButton
                label="+ Add yearly plan"
                tone="yearly"
                disabled={adding}
                onClick={() => openModal("yearly")}
              />
            }
          />
          <div className="space-y-2">
            {data.yearlyPlans.length === 0 ? (
              <Card className="border-violet-500/20 p-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-[var(--color-muted)]">
                    No yearly plans yet.
                  </p>
                  <AddPlanButton
                    label="+ Add your first yearly plan"
                    tone="yearly"
                    disabled={adding}
                    onClick={() => openModal("yearly")}
                  />
                </div>
              </Card>
            ) : (
              data.yearlyPlans.map((skill, i) => (
                <SkillPlanRow
                  key={skill.id}
                  skill={skill}
                  tone="yearly"
                  defaultOpen={i === 0}
                />
              ))
            )}
          </div>
        </section>

        <section id="monthly-pool">
          <SectionHeader
            number={3}
            count={data.monthlyPool.length}
            title="Monthly Plans"
            subtitle="All monthly goals for this year"
            accent="monthly"
            action={
              <AddPlanButton
                label="+ Add monthly plan"
                tone="monthly"
                disabled={adding}
                onClick={() => openModal("monthly")}
              />
            }
          />
          <div className="space-y-2">
            {data.monthlyPool.length === 0 ? (
              <Card className="border-amber-500/20 p-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-[var(--color-muted)]">
                    No monthly plans yet.
                  </p>
                  <AddPlanButton
                    label="+ Add your first monthly plan"
                    tone="monthly"
                    disabled={adding}
                    onClick={() => openModal("monthly")}
                  />
                </div>
              </Card>
            ) : (
              data.monthlyPool.map((skill) => (
                <SkillPlanRow key={skill.id} skill={skill} tone="monthly" />
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
