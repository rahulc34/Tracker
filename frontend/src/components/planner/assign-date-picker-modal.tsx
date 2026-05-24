"use client";

import { useState } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar";
import { formatDateKey } from "@/lib/calendar";
import { cn } from "@/lib/cn";

type AssignDatePickerModalProps = {
  skillTitle: string;
  monthLabel: string;
  days: CalendarDay[];
  currentDateKey?: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: (dateKey: string) => void;
};

export function AssignDatePickerModal({
  skillTitle,
  monthLabel,
  days,
  currentDateKey,
  saving,
  onClose,
  onConfirm,
}: AssignDatePickerModalProps) {
  const [picked, setPicked] = useState<string | null>(
    currentDateKey ?? days.find((d) => d.isToday)?.dateKey ?? days[0]?.dateKey ?? null,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[var(--color-month)]">
              <Calendar size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">
                Pick a date
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
              {skillTitle}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {monthLabel} — today through end of month
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text-strong)]"
          >
            <X size={18} />
          </button>
        </div>

        {days.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-muted)]">
            No assignable dates left in this month.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => {
                const isSelected = picked === day.dateKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    disabled={saving}
                    onClick={() => setPicked(day.dateKey)}
                    className={cn(
                      "flex min-w-[52px] flex-col items-center rounded-lg border px-2 py-2 transition-colors",
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 ring-1 ring-[var(--color-accent)]/40"
                        : "border-[var(--color-border)] bg-[var(--color-panel-elevated)] hover:border-[var(--color-month)]/50",
                      day.isToday && !isSelected && "border-[var(--color-month)]/60",
                    )}
                  >
                    <span className="text-[10px] text-[var(--color-muted)]">
                      {day.weekday}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-strong)]">
                      {day.day}
                    </span>
                  </button>
                );
              })}
            </div>

            {picked && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                Selected:{" "}
                <span className="text-[var(--color-text-strong)]">
                  {formatDateKey(picked)}
                </span>
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-xs text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!picked || saving}
                onClick={() => picked && onConfirm(picked)}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-medium text-[var(--color-bg)] disabled:opacity-40"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </span>
                ) : (
                  "Confirm date"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
