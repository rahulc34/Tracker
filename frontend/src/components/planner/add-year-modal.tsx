"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

export function AddYearModal({
  open,
  saving,
  existingYears = [],
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving?: boolean;
  existingYears?: number[];
  onClose: () => void;
  onSubmit: (yearNumber: number) => void;
}) {
  const [yearNumber, setYearNumber] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    if (open) setYearNumber(String(new Date().getFullYear()));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const parsed = Number(yearNumber);
  const isValid = Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100;
  const isDuplicate = existingYears.includes(parsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[var(--color-accent)]">
              <Calendar size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">
                New year
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
              Add a year
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Creates the year with all 12 months ready to plan.
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid || isDuplicate || saving) return;
            onSubmit(parsed);
          }}
        >
          <label className="mb-4 block text-xs font-medium text-[var(--color-text-strong)]">
            Year
            <input
              type="number"
              min={1900}
              max={2100}
              step={1}
              autoFocus
              value={yearNumber}
              onChange={(e) => setYearNumber(e.target.value)}
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          {isDuplicate && (
            <p className="mb-3 text-xs text-orange-300">
              {parsed} already exists in your timeline.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-xs text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isDuplicate || saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-medium text-[var(--color-bg)] disabled:opacity-40"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </>
              ) : (
                "Add year"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
