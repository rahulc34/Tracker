"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { AssignDatePickerModal } from "@/components/planner/assign-date-picker-modal";
import { Card, SectionHeader } from "@/components/ui/card";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { SkillStatusBadge } from "@/components/planner/skill-plan-row";
import { MONTH_NAMES } from "@/lib/constants";
import {
  buildAssignableDays,
  buildMonthCalendar,
  dateKeyFromIso,
  formatCreatedDate,
  formatDateKey,
  formatShortDate,
  isCurrentMonth,
} from "@/lib/calendar";
import { useApi } from "@/contexts/auth-context";
import type { MonthAssignment, MonthOverview, SkillSummary } from "@/lib/types";
import { cn } from "@/lib/cn";

type DaySkill = {
  skillId: string;
  skillTitle: string;
  assignmentId: string;
  progress: number;
  isCompleted: boolean;
  isReassignment: boolean;
};

type DatePickerContext =
  | { mode: "assign"; skillId: string; skillTitle: string }
  | {
      mode: "reassign";
      assignmentId: string;
      skillTitle: string;
      currentDateKey?: string;
    };

function formatDateChain(dates: string[]) {
  return dates
    .map((d) => formatShortDate(d))
    .join(" → ");
}

type AssignmentStatusFilter =
  | "all"
  | "in_progress"
  | "completed"
  | "overdue";

function assignmentDisplayStatus(a: MonthAssignment): string {
  return a.skill.isCompleted ? "completed" : a.status;
}

const STATUS_FILTERS: {
  id: AssignmentStatusFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "overdue", label: "Overdue" },
];

export function MonthView({
  monthId,
  data,
}: {
  monthId: string;
  data: MonthOverview;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const monthName = MONTH_NAMES[data.monthIndex - 1];

  const calendarDays = useMemo(
    () => buildMonthCalendar(data.yearNumber, data.monthIndex),
    [data.yearNumber, data.monthIndex],
  );

  const assignableDays = useMemo(
    () => buildAssignableDays(data.yearNumber, data.monthIndex),
    [data.yearNumber, data.monthIndex],
  );

  const defaultSelected =
    calendarDays.find((d) => d.isToday)?.dateKey ??
    calendarDays[0]?.dateKey ??
    null;

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    defaultSelected,
  );
  const [showPoolPicker, setShowPoolPicker] = useState(false);
  const [datePicker, setDatePicker] = useState<DatePickerContext | null>(null);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] =
    useState<AssignmentStatusFilter>("all");
  const todayButtonRef = useRef<HTMLButtonElement>(null);

  const viewingCurrentMonth = isCurrentMonth(data.yearNumber, data.monthIndex);

  useEffect(() => {
    if (!viewingCurrentMonth) return;
    todayButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [viewingCurrentMonth, monthId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["month-overview", monthId] });
    queryClient.invalidateQueries({ queryKey: ["year-overview"] });
    queryClient.invalidateQueries({ queryKey: ["root-overview"] });
  };

  const assignSkill = useMutation({
    mutationFn: ({ skillId, dateKey }: { skillId: string; dateKey: string }) =>
      api.assignSkillToMonth(monthId, skillId, dateKey),
    onSuccess: () => {
      invalidate();
      setShowPoolPicker(false);
      setDatePicker(null);
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to assign skill");
    },
  });

  const reassignSkill = useMutation({
    mutationFn: ({
      assignmentId,
      dateKey,
    }: {
      assignmentId: string;
      dateKey: string;
    }) => api.reassign(assignmentId, dateKey),
    onSuccess: () => {
      invalidate();
      setDatePicker(null);
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to reassign");
    },
  });

  const saving = assignSkill.isPending || reassignSkill.isPending;

  const skillsOnSelectedDay = useMemo((): DaySkill[] => {
    if (!selectedDateKey) return [];
    const pins = data.datePins.filter(
      (p) => dateKeyFromIso(p.pinnedDate) === selectedDateKey,
    );
    const seen = new Set<string>();
    const result: DaySkill[] = [];
    for (const pin of pins) {
      if (!pin.assignmentId || seen.has(pin.assignmentId)) continue;
      seen.add(pin.assignmentId);
      const assignment = data.assignments.find((a) => a.id === pin.assignmentId);
      result.push({
        skillId: pin.skillId ?? assignment?.skill.id ?? "",
        skillTitle: pin.skillTitle ?? assignment?.skill.title ?? "Skill",
        assignmentId: pin.assignmentId,
        progress: assignment?.skill.progress ?? 0,
        isCompleted: assignment?.skill.isCompleted ?? false,
        isReassignment: pin.isReassignment,
      });
    }
    return result;
  }, [selectedDateKey, data.datePins, data.assignments]);

  const pinsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const pin of data.datePins) {
      const key = dateKeyFromIso(pin.pinnedDate);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [data.datePins]);

  const assignmentStatusCounts = useMemo(() => {
    const counts = {
      all: data.assignments.length,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };
    for (const a of data.assignments) {
      const status = assignmentDisplayStatus(a);
      if (status === "in_progress") counts.in_progress++;
      else if (status === "completed") counts.completed++;
      else if (status === "overdue") counts.overdue++;
    }
    return counts;
  }, [data.assignments]);

  const filteredAssignments = useMemo(() => {
    const query = assignmentSearch.trim().toLowerCase();
    return data.assignments.filter((a) => {
      const status = assignmentDisplayStatus(a);
      if (assignmentStatusFilter !== "all" && status !== assignmentStatusFilter) {
        return false;
      }
      if (query && !a.skill.title.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [data.assignments, assignmentSearch, assignmentStatusFilter]);

  function openAssignDatePicker(skill: SkillSummary) {
    if (assignableDays.length === 0) {
      alert("No assignable dates left in this month");
      return;
    }
    setDatePicker({
      mode: "assign",
      skillId: skill.id,
      skillTitle: skill.title,
    });
  }

  function openReassignDatePicker(assignment: MonthAssignment) {
    if (assignment.skill.isCompleted) return;
    if (assignableDays.length === 0) {
      alert("No assignable dates left in this month");
      return;
    }
    setDatePicker({
      mode: "reassign",
      assignmentId: assignment.id,
      skillTitle: assignment.skill.title,
      currentDateKey: assignment.currentTargetDate
        ? dateKeyFromIso(assignment.currentTargetDate)
        : undefined,
    });
  }

  function confirmDatePick(dateKey: string) {
    if (!datePicker) return;
    if (datePicker.mode === "assign") {
      assignSkill.mutate({ skillId: datePicker.skillId, dateKey });
    } else {
      reassignSkill.mutate({ assignmentId: datePicker.assignmentId, dateKey });
    }
  }

  const selectedDayLabel = selectedDateKey
    ? formatDateKey(selectedDateKey)
    : null;

  return (
    <div className="space-y-6 p-4 md:space-y-8 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-strong)] md:text-2xl">
          {monthName} {data.yearNumber}
        </h1>
      </div>

      <Card className="flex flex-wrap items-center gap-6 p-4 md:gap-8 md:p-6">
        <ProgressRing value={data.progress} size={100} label="Month Track" />
        <div>
          <p className="text-sm text-[var(--color-text)]">
            {data.assignedCount} skills assigned, {data.completedCount} completed
          </p>
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-panel-elevated)] px-3 py-2">
              <TrendingUp size={16} className="text-[var(--color-month)]" />
              <div>
                <p className="text-lg font-bold text-[var(--color-text-strong)]">
                  {data.inProgressCount}
                </p>
                <p className="text-[10px] text-[var(--color-muted)]">In Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 ring-1 ring-orange-500/20">
              <AlertTriangle size={16} className="text-orange-400" />
              <div>
                <p className="text-lg font-bold text-[var(--color-text-strong)]">
                  {data.overdueCount}
                </p>
                <p className="text-[10px] text-[var(--color-muted)]">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <section>
        <SectionHeader number={1} title="Dates" accent="month" />
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          Click a date to see scheduled skills on that day.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {calendarDays.map((day) => {
            const pinCount = pinsByDay.get(day.dateKey) ?? 0;
            const isSelected = selectedDateKey === day.dateKey;
            return (
              <button
                key={day.dateKey}
                ref={day.isToday ? todayButtonRef : undefined}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                className={cn(
                  "flex min-w-[52px] flex-col items-center rounded-lg border p-2 transition-colors",
                  day.isPast &&
                    !day.isToday &&
                    "border-[var(--color-border)]/40 bg-[var(--color-panel)]/30 opacity-60",
                  !day.isPast &&
                    !day.isToday &&
                    "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-month)]/50",
                  day.isToday &&
                    !isSelected &&
                    "border-[var(--color-month)]/60 bg-[var(--color-month)]/10 ring-1 ring-[var(--color-month)]/30",
                  isSelected &&
                    "border-[var(--color-accent)] bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/40",
                )}
              >
                <span
                  className={cn(
                    "text-[10px]",
                    day.isToday
                      ? "font-semibold text-[var(--color-month)]"
                      : "text-[var(--color-muted)]",
                  )}
                >
                  {day.weekday}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    day.isToday
                      ? "text-[var(--color-month)]"
                      : day.isPast
                        ? "text-[var(--color-muted)]"
                        : "text-[var(--color-text-strong)]",
                  )}
                >
                  {day.day}
                </span>
                {pinCount > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: Math.min(pinCount, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[var(--color-month)]"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected day panel */}
      {selectedDateKey && selectedDayLabel && (
        <section>
          <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
              {selectedDayLabel}
            </h3>
            <p className="mb-3 text-xs text-[var(--color-muted)]">
              Skills scheduled on this day
            </p>
            {skillsOnSelectedDay.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                No skills assigned on this date yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {skillsOnSelectedDay.map((s) => (
                  <li
                    key={`${s.assignmentId}-${s.skillId}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-panel)] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/skill/${s.skillId}`}
                        className="text-sm font-medium text-[var(--color-text-strong)] hover:text-[var(--color-accent)]"
                      >
                        {s.skillTitle}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <ProgressBar
                          value={s.progress}
                          tone={s.isCompleted ? "success" : "month"}
                          className="w-20"
                        />
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {s.progress}%
                        </span>
                        {s.isReassignment && (
                          <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-300">
                            reassigned
                          </span>
                        )}
                      </div>
                    </div>
                    {s.isCompleted && (
                      <Check size={14} className="shrink-0 text-[var(--color-success)]" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}

      {/* Pool skills */}
      {data.poolSkills.length > 0 && (
        <section>
          <Card className="border-orange-500/30 bg-orange-500/5 p-4">
            <SectionHeader
              number={2}
              title="Assign unfinished skills"
              accent="monthly"
            />
            <p className="mb-3 text-xs text-[var(--color-muted)]">
              Pick a skill and choose a date from today through the end of the month.
            </p>
            <div className="space-y-2">
              {data.poolSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-3 rounded-lg bg-[var(--color-panel)] px-3 py-2"
                >
                  <GripVertical size={14} className="text-[var(--color-muted)]" />
                  <Link
                    href={`/skill/${skill.id}`}
                    className="flex-1 text-sm text-[var(--color-text-strong)]"
                  >
                    {skill.title}
                  </Link>
                  <ProgressBar value={skill.progress} tone="monthly" className="w-20" />
                  <button
                    type="button"
                    disabled={assignableDays.length === 0 || saving}
                    onClick={() => openAssignDatePicker(skill)}
                    className="rounded-md bg-orange-500/20 px-2 py-1 text-[10px] text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Assign to date
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Assigned skills table */}
      <section>
        <SectionHeader number={3} title="Assigned skills this month" accent="month" />
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            />
            <input
              type="search"
              value={assignmentSearch}
              onChange={(e) => setAssignmentSearch(e.target.value)}
              placeholder="Search skills…"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((filter) => {
              const active = assignmentStatusFilter === filter.id;
              const count = assignmentStatusCounts[filter.id];
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setAssignmentStatusFilter(filter.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30"
                      : "bg-[var(--color-panel)] text-[var(--color-muted)] hover:text-[var(--color-text-strong)]",
                  )}
                >
                  {filter.label}
                  <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-muted)]">
                <th className="px-4 py-3 font-medium">Skill</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Resources</th>
                <th className="px-4 py-3 font-medium">Sub-skills</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Assign date</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-[var(--color-muted)]"
                  >
                    {data.assignments.length === 0
                      ? "No skills assigned this month yet."
                      : "No skills match your search or filter."}
                  </td>
                </tr>
              ) : (
              filteredAssignments.map((a) => {
                const historyDates = (a.datePins ?? []).map((p) => p.pinnedDate);
                const assignDate = a.currentTargetDate;
                const canEditDate = !a.skill.isCompleted && assignableDays.length > 0;

                return (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/skill/${a.skill.id}`}
                        className="font-medium text-[var(--color-text-strong)] hover:text-[var(--color-accent)]"
                      >
                        {a.skill.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <SkillStatusBadge
                        status={a.skill.isCompleted ? "completed" : a.status}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{a.skill.progress}%</span>
                        <ProgressBar
                          value={a.skill.progress}
                          tone={a.skill.isCompleted ? "success" : "accent"}
                          className="w-16"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                        <FileText size={12} />
                        {a.skill.resourceCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(a.skill.subSkillTags ?? []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-[var(--color-panel-elevated)] px-1.5 py-0.5 text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                      {a.createdAt ? formatCreatedDate(a.createdAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {assignDate ? (
                        canEditDate ? (
                          <button
                            type="button"
                            disabled={saving}
                            title={
                              historyDates.length > 1
                                ? `History: ${formatDateChain(historyDates)}`
                                : undefined
                            }
                            onClick={() => openReassignDatePicker(a)}
                            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent)]/10 px-2 py-1 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
                          >
                            {formatShortDate(assignDate)}
                            {a.skill.isCompleted && (
                              <Check size={12} className="text-[var(--color-success)]" />
                            )}
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[var(--color-muted)]"
                            title={
                              historyDates.length > 1
                                ? `History: ${formatDateChain(historyDates)}`
                                : undefined
                            }
                          >
                            {formatShortDate(assignDate)}
                            {a.skill.isCompleted && (
                              <Check size={12} className="text-[var(--color-success)]" />
                            )}
                          </span>
                        )
                      ) : (
                        <span className="text-[var(--color-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </Card>

        {data.poolSkills.length > 0 && (
          <button
            type="button"
            disabled={assignableDays.length === 0}
            onClick={() => setShowPoolPicker(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-medium text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
            Assign skill from monthly pool
            <ArrowRight size={14} />
          </button>
        )}
      </section>

      {showPoolPicker && (
        <PoolPickerModal
          skills={data.poolSkills}
          saving={assignSkill.isPending}
          onClose={() => setShowPoolPicker(false)}
          onPick={(skillId) => {
            const skill = data.poolSkills.find((s) => s.id === skillId);
            if (skill) {
              setShowPoolPicker(false);
              openAssignDatePicker(skill);
            }
          }}
        />
      )}

      {datePicker && (
        <AssignDatePickerModal
          skillTitle={datePicker.skillTitle}
          monthLabel={`${monthName} ${data.yearNumber}`}
          days={assignableDays}
          currentDateKey={
            datePicker.mode === "reassign" ? datePicker.currentDateKey : undefined
          }
          saving={saving}
          onClose={() => setDatePicker(null)}
          onConfirm={confirmDatePick}
        />
      )}
    </div>
  );
}

function PoolPickerModal({
  skills,
  saving,
  onClose,
  onPick,
}: {
  skills: SkillSummary[];
  saving: boolean;
  onClose: () => void;
  onPick: (skillId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
              Pick a skill
            </h3>
            <p className="text-xs text-[var(--color-muted)]">
              Then choose a date for this month
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--color-muted)]">
            <X size={18} />
          </button>
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {skills.map((skill) => (
            <li key={skill.id}>
              <button
                type="button"
                disabled={saving}
                onClick={() => onPick(skill.id)}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 disabled:opacity-50"
              >
                <span className="font-medium text-[var(--color-text-strong)]">
                  {skill.title}
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  {skill.progress}%
                </span>
              </button>
            </li>
          ))}
        </ul>
        {saving && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Assigning…
          </div>
        )}
      </div>
    </div>
  );
}
