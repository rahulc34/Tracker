"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  GripVertical,
  Link2,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import type { SkillResource, SkillSummary } from "@/lib/types";
import { ProgressBar } from "@/components/ui/progress";

const toneStyles = {
  yearly: {
    badge: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40",
    tag: "border-violet-500/40 bg-violet-500/10 text-violet-200",
    bar: "yearly" as const,
    check: "border-violet-500/50",
    expandedBg: "bg-violet-500/[0.04]",
    label: "text-violet-400/80",
  },
  monthly: {
    badge: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
    tag: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    bar: "monthly" as const,
    check: "border-amber-500/50",
    expandedBg: "bg-amber-500/[0.04]",
    label: "text-amber-400/80",
  },
};

export function SkillPlanRow({
  skill,
  tone = "yearly",
  defaultOpen = false,
}: {
  skill: SkillSummary;
  tone?: "yearly" | "monthly";
  defaultOpen?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(defaultOpen);
  const [completed, setCompleted] = useState(skill.isCompleted);
  const [progress, setProgress] = useState(skill.progress);
  const progressBeforeComplete = useRef(skill.progress);
  const s = toneStyles[tone];

  useEffect(() => {
    setCompleted(skill.isCompleted);
    setProgress(skill.progress);
    if (!skill.isCompleted) {
      progressBeforeComplete.current = skill.progress;
    }
  }, [skill.isCompleted, skill.progress]);

  const toggleComplete = useMutation({
    mutationFn: async (next: boolean) => {
      const restored = progressBeforeComplete.current;
      return api.updateSkill(skill.id, {
        isCompleted: next,
        progress: next ? 100 : restored,
      });
    },
    onMutate: (next) => {
      if (next) progressBeforeComplete.current = progress;
      setCompleted(next);
      setProgress(next ? 100 : progressBeforeComplete.current);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["year-overview"] });
      queryClient.invalidateQueries({ queryKey: ["root-overview"] });
      queryClient.invalidateQueries({ queryKey: ["month-overview"] });
      queryClient.invalidateQueries({ queryKey: ["skill", skill.id] });
    },
    onError: () => {
      setCompleted(skill.isCompleted);
      setProgress(skill.progress);
    },
  });

  function handleToggleComplete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (toggleComplete.isPending) return;
    toggleComplete.mutate(!completed);
  }

  const resources = skill.resources ?? [];
  const links = resources.filter((r) => r.type === "link");
  const notes = resources.filter((r) => r.type === "note");
  const files = resources.filter((r) => r.type === "file");
  const docCount = notes.length + files.length;
  const tags =
    skill.subSkillTags ?? skill.subSkills?.map((sub) => sub.title) ?? [];

  const hasExpandContent =
    links.length > 0 ||
    notes.length > 0 ||
    files.length > 0 ||
    !!skill.description ||
    tags.length > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-elevated)]/40",
        tone === "yearly" && "border-violet-500/20",
        tone === "monthly" && "border-amber-500/20",
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4">
        <GripVertical
          size={16}
          className="hidden shrink-0 text-[var(--color-muted)]/40 sm:block"
        />

        <button
          type="button"
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
          aria-pressed={completed}
          disabled={toggleComplete.isPending}
          onClick={handleToggleComplete}
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors",
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : cn("bg-transparent hover:border-emerald-500/60", s.check),
            toggleComplete.isPending && "opacity-60",
          )}
        >
          {toggleComplete.isPending ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            completed && <Check size={11} strokeWidth={3} />
          )}
        </button>

        <Link
          href={`/skill/${skill.id}`}
          className="min-w-0 shrink-0 text-sm font-semibold text-[var(--color-text-strong)] hover:text-[var(--color-accent)] sm:min-w-[140px]"
        >
          {skill.title}
        </Link>

        <div className="hidden min-w-[80px] flex-1 sm:block">
          <ProgressBar value={progress} tone={s.bar} className="h-2" />
        </div>

        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
            s.badge,
          )}
        >
          {progress}%
        </span>

        <div className="hidden items-center gap-3 text-[var(--color-muted)] md:flex">
          <span className="flex items-center gap-1 text-xs">
            <Link2 size={13} className="opacity-70" />
            <span className="tabular-nums">{links.length}</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <FileText size={13} className="opacity-70" />
            <span className="tabular-nums">{docCount}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={!hasExpandContent}
          className={cn(
            "ml-auto shrink-0 rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-text)]",
            !hasExpandContent && "invisible",
          )}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Mobile progress bar */}
      <div className="px-4 pb-2 sm:hidden">
        <ProgressBar value={progress} tone={s.bar} className="h-1.5" />
      </div>

      {/* Sub-skills row — always visible when tags exist */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)]/60 px-4 py-2.5 pl-4 sm:pl-12">
          <span className={cn("text-[11px] font-medium", s.label)}>
            Sub-skills:
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                s.tag,
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded detail panel */}
      {open && hasExpandContent && (
        <div
          className={cn(
            "border-t border-[var(--color-border)]/60 px-4 py-4 sm:px-6",
            s.expandedBg,
          )}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <ExpandCol title="Resources" labelClass={s.label}>
              {links.length === 0 && files.length === 0 ? (
                <EmptyText>No links yet</EmptyText>
              ) : (
                <>
                  {links.map((r) => (
                    <ResourceLink key={r.id} resource={r} />
                  ))}
                  {files.map((r) => (
                    <FileRow key={r.id} resource={r} />
                  ))}
                </>
              )}
            </ExpandCol>

            <ExpandCol title="Note" labelClass={s.label}>
              {notes.length === 0 && !skill.description ? (
                <EmptyText>No notes yet</EmptyText>
              ) : (
                <>
                  {skill.description && (
                    <p className="flex gap-2 text-xs leading-relaxed text-[var(--color-text)]">
                      <FileText
                        size={14}
                        className="mt-0.5 shrink-0 text-[var(--color-muted)]"
                      />
                      <span>
                        <span className="font-medium text-[var(--color-muted)]">
                          Note:{" "}
                        </span>
                        {skill.description}
                      </span>
                    </p>
                  )}
                  {notes.map((n) => (
                    <p
                      key={n.id}
                      className="flex gap-2 text-xs leading-relaxed text-[var(--color-text)]"
                    >
                      <FileText
                        size={14}
                        className="mt-0.5 shrink-0 text-[var(--color-muted)]"
                      />
                      <span>
                        <span className="font-medium text-[var(--color-muted)]">
                          Note:{" "}
                        </span>
                        {n.content ?? n.title}
                      </span>
                    </p>
                  ))}
                </>
              )}
            </ExpandCol>

            <ExpandCol title="Sub-skills" labelClass={s.label}>
              {tags.length === 0 ? (
                <EmptyText>No sub-skills yet</EmptyText>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                        s.tag,
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </ExpandCol>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandCol({
  title,
  labelClass,
  children,
}: {
  title: string;
  labelClass: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wide", labelClass)}>
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ResourceLink({ resource }: { resource: SkillResource }) {
  return (
    <a
      href={resource.url ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-xs text-[var(--color-text)] hover:text-[var(--color-accent)]"
    >
      <Link2 size={13} className="shrink-0 text-[var(--color-muted)]" />
      <span className="truncate">{resource.title}</span>
      <ExternalLink size={11} className="shrink-0 opacity-50" />
    </a>
  );
}

function FileRow({ resource }: { resource: SkillResource }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--color-text)]">
      <FileText size={13} className="shrink-0 text-[var(--color-muted)]" />
      <span className="truncate">{resource.title}</span>
      {resource.url && (
        <span className="truncate text-[var(--color-muted)]">
          ({resource.url})
        </span>
      )}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs italic text-[var(--color-muted)]">{children}</p>
  );
}

export function SkillStatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
      : status === "overdue"
        ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30"
        : "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone,
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
