"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  FileText,
  Folder,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssignmentTracker } from "@/components/planner/assignment-tracker";
import { Badge, Card } from "@/components/ui/card";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { useApi } from "@/contexts/auth-context";
import { deriveFromSubSkills } from "@/lib/skill-progress";
import type { SkillDetail, SkillResource, SubSkill } from "@/lib/types";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

export function SkillView({ skill }: { skill: SkillDetail }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [subSkills, setSubSkills] = useState(skill.subSkills);
  const [resources, setResources] = useState(skill.resources);
  const [parentProgress, setParentProgress] = useState(skill.progress);
  const [parentCompleted, setParentCompleted] = useState(skill.isCompleted);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setSubSkills(skill.subSkills);
    setResources(skill.resources);
    setParentProgress(skill.progress);
    setParentCompleted(skill.isCompleted);
  }, [skill]);

  const derived = useMemo(() => deriveFromSubSkills(subSkills), [subSkills]);
  const hasSubSkills = subSkills.length > 0;
  const displayProgress = derived?.progress ?? parentProgress;
  const displayCompleted = derived?.isCompleted ?? parentCompleted;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["skill", skill.id] });
    queryClient.invalidateQueries({ queryKey: ["year-overview"] });
    queryClient.invalidateQueries({ queryKey: ["root-overview"] });
    queryClient.invalidateQueries({ queryKey: ["month-overview"] });
  };

  const updateSubSkill = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { progress?: number; isCompleted?: boolean };
    }) => api.updateSkill(id, data),
    onSuccess: () => invalidate(),
    onError: () => invalidate(),
  });

  const updateParent = useMutation({
    mutationFn: (data: { progress?: number; isCompleted?: boolean }) =>
      api.updateSkill(skill.id, data),
    onSuccess: () => invalidate(),
  });

  const addSubSkill = useMutation({
    mutationFn: (title: string) => api.createSubSkill(skill.id, { title }),
    onSuccess: () => {
      invalidate();
      setShowAddSub(false);
    },
  });

  const addResource = useMutation({
    mutationFn: (data: {
      type: "link" | "note" | "folder" | "file";
      title: string;
      url?: string;
      content?: string;
    }) => api.createResource(skill.id, data),
    onSuccess: () => {
      invalidate();
      setShowAddResource(false);
    },
  });

  const removeResource = useMutation({
    mutationFn: (id: string) => api.deleteResource(id),
    onSuccess: () => invalidate(),
  });

  const deleteSkill = useMutation({
    mutationFn: () => api.deleteSkill(skill.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["year-overview"] });
      queryClient.invalidateQueries({ queryKey: ["root-overview"] });
      queryClient.invalidateQueries({ queryKey: ["month-overview"] });
      queryClient.invalidateQueries({ queryKey: ["plan-search-index"] });
      const hash = skill.scope === "yearly" ? "#yearly" : "#monthly-pool";
      router.push(`/year/${skill.year.id}${hash}`);
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to delete skill");
    },
  });

  function handleSubToggle(sub: SubSkill) {
    const next = !sub.isCompleted;
    const progress = next ? 100 : sub.progress === 100 ? 0 : sub.progress;
    setSubSkills((prev) =>
      prev.map((s) =>
        s.id === sub.id ? { ...s, isCompleted: next, progress } : s,
      ),
    );
    updateSubSkill.mutate({
      id: sub.id,
      data: { isCompleted: next, progress },
    });
  }

  function handleSubSlider(sub: SubSkill, value: number) {
    const progress = value;
    const isCompleted = progress >= 100;
    setSubSkills((prev) =>
      prev.map((s) =>
        s.id === sub.id ? { ...s, progress, isCompleted } : s,
      ),
    );
  }

  function handleSubSliderCommit(sub: SubSkill, value: number) {
    const progress = value;
    const isCompleted = progress >= 100;
    updateSubSkill.mutate({
      id: sub.id,
      data: { progress, isCompleted },
    });
  }

  function handleParentToggle() {
    if (hasSubSkills) return;
    const next = !parentCompleted;
    const progress = next ? 100 : parentProgress === 100 ? 0 : parentProgress;
    setParentCompleted(next);
    setParentProgress(progress);
    updateParent.mutate({ isCompleted: next, progress });
  }

  function handleParentSlider(value: number) {
    if (hasSubSkills) return;
    setParentProgress(value);
  }

  function handleParentSliderCommit(value: number) {
    if (hasSubSkills) return;
    const isCompleted = value >= 100;
    setParentCompleted(isCompleted);
    updateParent.mutate({ progress: value, isCompleted });
  }

  const assignment =
    skill.assignments.find(
      (a) => a.status === "in_progress" || a.status === "overdue",
    ) ?? skill.assignments[0];
  const barTone = skill.scope === "yearly" ? "yearly" : "monthly";

  return (
    <>
      <AddSubSkillModal
        open={showAddSub}
        saving={addSubSkill.isPending}
        onClose={() => setShowAddSub(false)}
        onSubmit={(title) => addSubSkill.mutate(title)}
      />
      <AddResourceModal
        open={showAddResource}
        saving={addResource.isPending}
        onClose={() => setShowAddResource(false)}
        onSubmit={(data) => addResource.mutate(data)}
      />
      <DeleteSkillModal
        open={showDeleteConfirm}
        skillTitle={skill.title}
        saving={deleteSkill.isPending}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteSkill.mutate()}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-sm text-violet-300 sm:h-12 sm:w-12">
                {"</>"}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-[var(--color-text-strong)] sm:text-2xl">
                  {skill.title}
                </h1>
                <div className="mt-2 flex gap-2">
                  <Badge tone={skill.scope === "yearly" ? "yearly" : "monthly"}>
                    {skill.scope === "yearly" ? "Yearly Plan" : "Monthly Plan"}
                  </Badge>
                  <Badge tone="info">Skill</Badge>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteSkill.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>

          <Card className="mb-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-6 md:gap-8">
              <ProgressRing
                value={displayProgress}
                label="Overall Progress"
              />
              <div className="min-w-[200px] flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-muted)]">Progress</span>
                    <span className="font-semibold tabular-nums text-[var(--color-text-strong)]">
                      {displayProgress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={displayProgress}
                    disabled={hasSubSkills || updateParent.isPending}
                    onChange={(e) =>
                      handleParentSlider(Number(e.target.value))
                    }
                    onMouseUp={(e) =>
                      handleParentSliderCommit(
                        Number((e.target as HTMLInputElement).value),
                      )
                    }
                    onTouchEnd={(e) =>
                      handleParentSliderCommit(
                        Number((e.target as HTMLInputElement).value),
                      )
                    }
                    className={cn(
                      "h-2 w-full cursor-pointer accent-[var(--color-accent)]",
                      hasSubSkills && "cursor-not-allowed opacity-60",
                    )}
                  />
                  <ProgressBar value={displayProgress} tone={barTone} />
                </div>

                <label
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    hasSubSkills ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  )}
                >
                  <button
                    type="button"
                    disabled={hasSubSkills || updateParent.isPending}
                    onClick={handleParentToggle}
                    className={cn(
                      "flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-2 transition-colors",
                      displayCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-[var(--color-border)] bg-transparent",
                    )}
                  >
                    {displayCompleted && <Check size={11} strokeWidth={3} />}
                  </button>
                  <span className="text-[var(--color-text)]">Completed</span>
                  {hasSubSkills && (
                    <span className="text-[10px] text-[var(--color-muted)]">
                      (calculated from sub-skills)
                    </span>
                  )}
                </label>
              </div>
              <div className="flex gap-3 text-center">
                <StatChip label="sub-skills" value={subSkills.length} />
                <StatChip label="resources" value={resources.length} />
                {skill.startedAt && (
                  <StatChip
                    label="started"
                    value={new Date(skill.startedAt).toLocaleDateString(
                      "en-US",
                      { month: "short", year: "numeric" },
                    )}
                  />
                )}
              </div>
            </div>
          </Card>

          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">
                Sub-skills
              </h2>
              <button
                type="button"
                onClick={() => setShowAddSub(true)}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
              >
                <Plus size={14} />
                Add sub-skill
              </button>
            </div>
            {subSkills.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-sm text-[var(--color-muted)]">
                No sub-skills yet. Add one to track progress in parts.
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {subSkills.map((sub) => (
                  <Card key={sub.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--color-text-strong)]">
                        {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSubToggle(sub)}
                        disabled={updateSubSkill.isPending}
                        className={cn(
                          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors",
                          sub.isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-violet-500/50 bg-transparent hover:border-emerald-500/60",
                        )}
                      >
                        {sub.isCompleted && (
                          <Check size={11} strokeWidth={3} />
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sub.progress}
                        onChange={(e) =>
                          handleSubSlider(sub, Number(e.target.value))
                        }
                        onMouseUp={(e) =>
                          handleSubSliderCommit(
                            sub,
                            Number((e.target as HTMLInputElement).value),
                          )
                        }
                        onTouchEnd={(e) =>
                          handleSubSliderCommit(
                            sub,
                            Number((e.target as HTMLInputElement).value),
                          )
                        }
                        className="h-1.5 w-full cursor-pointer accent-violet-500"
                      />
                      <div className="flex items-center justify-between">
                        <ProgressBar
                          value={sub.progress}
                          tone={sub.isCompleted ? "success" : "yearly"}
                          className="flex-1"
                        />
                        <span className="ml-2 text-xs font-semibold tabular-nums text-[var(--color-muted)]">
                          {sub.progress}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-strong)]">
                Resources
              </h2>
              <button
                type="button"
                onClick={() => setShowAddResource(true)}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
              >
                <Plus size={14} />
                Add link, note, or folder
              </button>
            </div>
            <Card className="divide-y divide-[var(--color-border)]">
              {resources.length === 0 ? (
                <p className="p-4 text-sm text-[var(--color-muted)]">
                  No resources yet.
                </p>
              ) : (
                resources.map((r) => (
                  <ResourceRow
                    key={r.id}
                    resource={r}
                    removing={removeResource.isPending}
                    onRemove={() => removeResource.mutate(r.id)}
                  />
                ))
              )}
            </Card>
          </section>
        </div>

        {assignment && (
          <AssignmentTracker
            assignment={assignment}
            skillIsCompleted={displayCompleted}
          />
        )}
      </div>
    </>
  );
}

function ResourceRow({
  resource,
  onRemove,
  removing,
}: {
  resource: SkillResource;
  onRemove: () => void;
  removing: boolean;
}) {
  const Icon =
    resource.type === "link"
      ? Link2
      : resource.type === "folder"
        ? Folder
        : FileText;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon
        size={16}
        className={cn(
          "mt-0.5 shrink-0",
          resource.type === "link"
            ? "text-[var(--color-accent)]"
            : resource.type === "folder"
              ? "text-amber-400"
              : "text-violet-400",
        )}
      />
      <div className="min-w-0 flex-1">
        {resource.type === "link" && resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm text-[var(--color-text-strong)] hover:text-[var(--color-accent)]"
          >
            {resource.title}
            <ExternalLink size={12} />
          </a>
        ) : (
          <>
            <p className="text-sm font-medium capitalize text-[var(--color-text-strong)]">
              {resource.type}: {resource.title}
            </p>
            {resource.content && (
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {resource.content}
              </p>
            )}
            {resource.url && resource.type !== "link" && (
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {resource.url}
              </p>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        disabled={removing}
        onClick={onRemove}
        className="shrink-0 rounded p-1.5 text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function AddSubSkillModal({
  open,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (open) setTitle("");
  }, [open]);
  if (!open) return null;

  return (
    <ModalShell title="Add sub-skill" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onSubmit(title.trim());
        }}
      >
        <label className="mb-4 block text-xs font-medium text-[var(--color-text-strong)]">
          Sub-skill name
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. React, HTML"
            className={cn(inputClass, "mt-1.5")}
          />
        </label>
        <ModalActions saving={saving} onClose={onClose} submitLabel="Add sub-skill" />
      </form>
    </ModalShell>
  );
}

function AddResourceModal({
  open,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: "link" | "note" | "folder" | "file";
    title: string;
    url?: string;
    content?: string;
  }) => void;
}) {
  const [type, setType] = useState<"link" | "note" | "folder" | "file">("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setType("link");
      setTitle("");
      setUrl("");
      setContent("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <ModalShell title="Add resource" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onSubmit({
            type,
            title: title.trim(),
            ...(type === "link" || type === "file"
              ? { url: url.trim() || undefined }
              : {}),
            ...(type === "note" ? { content: content.trim() || undefined } : {}),
          });
        }}
      >
        <label className="mb-3 block text-xs font-medium text-[var(--color-text-strong)]">
          Type
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "link" | "note" | "folder" | "file")
            }
            className={cn(inputClass, "mt-1.5")}
          >
            <option value="link">Link</option>
            <option value="note">Note</option>
            <option value="folder">Folder</option>
            <option value="file">File</option>
          </select>
        </label>
        <label className="mb-3 block text-xs font-medium text-[var(--color-text-strong)]">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource name"
            className={cn(inputClass, "mt-1.5")}
          />
        </label>
        {(type === "link" || type === "file") && (
          <label className="mb-3 block text-xs font-medium text-[var(--color-text-strong)]">
            URL {type === "file" ? "or path" : ""}
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className={cn(inputClass, "mt-1.5")}
            />
          </label>
        )}
        {type === "note" && (
          <label className="mb-3 block text-xs font-medium text-[var(--color-text-strong)]">
            Note content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className={cn(inputClass, "mt-1.5 resize-none")}
            />
          </label>
        )}
        <ModalActions saving={saving} onClose={onClose} submitLabel="Add resource" />
      </form>
    </ModalShell>
  );
}

function DeleteSkillModal({
  open,
  skillTitle,
  saving,
  onClose,
  onConfirm,
}: {
  open: boolean;
  skillTitle: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <ModalShell title="Delete skill" onClose={onClose}>
      <p className="mb-2 text-sm text-[var(--color-text)]">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-[var(--color-text-strong)]">
          {skillTitle}
        </span>
        ?
      </p>
      <p className="mb-5 text-xs text-[var(--color-muted)]">
        This removes the plan, sub-skills, resources, and any month assignments.
        This action cannot be undone.
      </p>
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
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 size={14} />
              Delete skill
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
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
          <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
            {title}
          </h3>
          <button type="button" onClick={onClose} className="text-[var(--color-muted)]">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  saving,
  onClose,
  submitLabel,
}: {
  saving: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-3 py-2 text-sm text-[var(--color-muted)]"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] disabled:opacity-50"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--color-panel-elevated)] px-3 py-2">
      <p className="text-sm font-bold text-[var(--color-text-strong)]">{value}</p>
      <p className="text-[10px] text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
