"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/card";
import type { AssignmentEvent, MonthAssignment } from "@/lib/types";
import { cn } from "@/lib/cn";

type TrackerAssignment = MonthAssignment | Omit<MonthAssignment, "skill">;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function eventTypeLabel(type: string) {
  if (type === "created") return "Created";
  if (type === "reassigned") return "Reassigned";
  if (type === "completed") return "Completed";
  return type;
}

function statusTone(status: string): "success" | "warning" | "info" {
  if (status === "completed") return "success";
  if (status === "incomplete") return "warning";
  return "info";
}

function nodeColor(status: string) {
  if (status === "completed") return "bg-[var(--color-success)]";
  if (status === "incomplete") return "bg-orange-400";
  if (status === "in_progress") return "bg-[var(--color-accent)]";
  return "bg-[var(--color-muted)]";
}

export function AssignmentTracker({
  assignment,
  skillIsCompleted = false,
}: {
  assignment: TrackerAssignment;
  skillIsCompleted?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const events = assignment.events ?? [];
  const isSkillDone =
    skillIsCompleted || assignment.status === "completed";
  const showCurrentTarget =
    !isSkillDone && assignment.currentTargetDate != null;

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-panel)] p-4 lg:w-[320px] lg:border-l lg:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-1 flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">
            Assignment Tracker
          </h2>
          <Info size={14} className="text-[var(--color-muted)]" />
        </div>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-[var(--color-muted)]" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-[var(--color-muted)]" />
        )}
      </button>
      <p className="mb-4 text-[10px] text-[var(--color-muted)]">
        Skill date history — you choose when to reschedule
      </p>

      {open && (
        <>
          <div className="space-y-0">
            {events.map((ev, i) => (
              <TimelineEvent
                key={ev.id}
                event={ev}
                isLast={i === events.length - 1 && !showCurrentTarget}
                connectorDashed={false}
              />
            ))}

            {showCurrentTarget && assignment.currentTargetDate && (
              <>
                <div className="relative flex gap-3 pb-2">
                  <div className="flex w-3.5 shrink-0 flex-col items-center">
                    <div className="h-4 w-px border-l border-dashed border-[var(--color-border)]" />
                  </div>
                </div>
                <div className="relative flex gap-3 pb-4">
                  <div className="relative flex w-3.5 shrink-0 flex-col items-center">
                    <div className="absolute -inset-1 rounded-full bg-[var(--color-accent)]/20 blur-sm" />
                    <div className="relative z-10 mt-0.5 h-4 w-4 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/25 ring-offset-2 ring-offset-[var(--color-panel)]" />
                  </div>
                  <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-panel-elevated)] p-3 shadow-lg shadow-[var(--color-accent)]/5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
                      Current target date
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-strong)]">
                      <Calendar size={14} className="text-[var(--color-accent)]" />
                      {formatDate(assignment.currentTargetDate)}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                      This is the active target date for this skill.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-2 flex gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-elevated)]/50 p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
            <p className="text-[10px] leading-relaxed text-[var(--color-muted)]">
              If a skill is not done by the target date, nothing moves automatically.
              Open the month view and pick a new assign date when you are ready.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}

function TimelineEvent({
  event,
  isLast,
  connectorDashed,
}: {
  event: AssignmentEvent;
  isLast: boolean;
  connectorDashed: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-6">
      {!isLast && (
        <div
          className={cn(
            "absolute left-[7px] top-4 flex h-[calc(100%-4px)] w-px flex-col items-center",
            connectorDashed
              ? "border-l border-dashed border-[var(--color-border)]"
              : "bg-[var(--color-border)]",
          )}
        >
          {!connectorDashed && (
            <span className="mt-auto mb-0.5 text-[8px] leading-none text-[var(--color-muted)]">
              ↓
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-[var(--color-panel)]",
          nodeColor(event.status),
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--color-text-strong)]">
          {formatDate(event.eventDate)}
        </p>
        <p className="text-[10px] text-[var(--color-muted)]">
          {eventTypeLabel(event.eventType)}
        </p>
        <div className="mt-1">
          <Badge tone={statusTone(event.status)}>
            {event.status.replace("_", " ")}
          </Badge>
        </div>
        {event.eventType === "reassigned" && event.note && (
          <p className="mt-1 text-[10px] text-orange-300">{event.note}</p>
        )}
      </div>
    </div>
  );
}
