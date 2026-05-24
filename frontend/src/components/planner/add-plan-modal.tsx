"use client";

import { useEffect, useState } from "react";
import { FileText, Link2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type LinkEntry = { id: string; title: string; url: string };
export type FileEntry = { id: string; title: string; url: string };
export type SubSkillEntry = { id: string; title: string };

export type AddPlanFormData = {
  title: string;
  description: string;
  estimatedDays: string;
  links: LinkEntry[];
  files: FileEntry[];
  subSkills: SubSkillEntry[];
};

type Props = {
  open: boolean;
  scope: "yearly" | "monthly";
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: AddPlanFormData) => void;
};

const emptyForm = (): AddPlanFormData => ({
  title: "",
  description: "",
  estimatedDays: "",
  links: [],
  files: [],
  subSkills: [],
});

function newId() {
  return Math.random().toString(36).slice(2, 9);
}

export function AddPlanModal({
  open,
  scope,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<AddPlanFormData>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open, scope]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const accent =
    scope === "yearly" ? "var(--color-yearly)" : "var(--color-monthly)";
  const label = scope === "yearly" ? "Yearly Plan" : "Monthly Plan";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl">
        <div
          className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"
          style={{ borderTopColor: accent, borderTopWidth: 3 }}
        >
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-strong)]">
              Add {label}
            </h2>
            <p className="text-xs text-[var(--color-muted)]">
              {scope === "yearly"
                ? "Long-term goal with resources & sub-skills"
                : "1–20 day item for the monthly pool"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <Field label="Skill name" required>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Learn Frontend"
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Goal explanation, milestones…"
                rows={2}
                className={cn(inputClass, "resize-none")}
              />
            </Field>

            {scope === "monthly" && (
              <Field label="Estimated days" hint="1–20 days">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.estimatedDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimatedDays: e.target.value }))
                  }
                  placeholder="e.g. 7"
                  className={inputClass}
                />
              </Field>
            )}

            <ListSection
              title="Links"
              icon={<Link2 size={14} className="text-[var(--color-accent)]" />}
              onAdd={() =>
                setForm((f) => ({
                  ...f,
                  links: [...f.links, { id: newId(), title: "", url: "" }],
                }))
              }
            >
              {form.links.length === 0 ? (
                <EmptyHint>No links yet</EmptyHint>
              ) : (
                form.links.map((link, i) => (
                  <div key={link.id} className="flex gap-2">
                    <input
                      value={link.title}
                      onChange={(e) =>
                        setForm((f) => {
                          const links = [...f.links];
                          links[i] = { ...links[i]!, title: e.target.value };
                          return { ...f, links };
                        })
                      }
                      placeholder="Title"
                      className={cn(inputClass, "flex-1")}
                    />
                    <input
                      value={link.url}
                      onChange={(e) =>
                        setForm((f) => {
                          const links = [...f.links];
                          links[i] = { ...links[i]!, url: e.target.value };
                          return { ...f, links };
                        })
                      }
                      placeholder="https://…"
                      className={cn(inputClass, "flex-[2]")}
                    />
                    <RemoveBtn
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          links: f.links.filter((l) => l.id !== link.id),
                        }))
                      }
                    />
                  </div>
                ))
              )}
            </ListSection>

            <ListSection
              title="Files"
              icon={<FileText size={14} className="text-violet-400" />}
              onAdd={() =>
                setForm((f) => ({
                  ...f,
                  files: [...f.files, { id: newId(), title: "", url: "" }],
                }))
              }
            >
              {form.files.length === 0 ? (
                <EmptyHint>No files yet — add a name & link/path</EmptyHint>
              ) : (
                form.files.map((file, i) => (
                  <div key={file.id} className="flex gap-2">
                    <input
                      value={file.title}
                      onChange={(e) =>
                        setForm((f) => {
                          const files = [...f.files];
                          files[i] = { ...files[i]!, title: e.target.value };
                          return { ...f, files };
                        })
                      }
                      placeholder="File name"
                      className={cn(inputClass, "flex-1")}
                    />
                    <input
                      value={file.url}
                      onChange={(e) =>
                        setForm((f) => {
                          const files = [...f.files];
                          files[i] = { ...files[i]!, url: e.target.value };
                          return { ...f, files };
                        })
                      }
                      placeholder="URL or path"
                      className={cn(inputClass, "flex-[2]")}
                    />
                    <RemoveBtn
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          files: f.files.filter((x) => x.id !== file.id),
                        }))
                      }
                    />
                  </div>
                ))
              )}
            </ListSection>

            <ListSection
              title="Sub-skills"
              icon={<span className="text-xs text-[var(--color-yearly)]">◆</span>}
              onAdd={() =>
                setForm((f) => ({
                  ...f,
                  subSkills: [...f.subSkills, { id: newId(), title: "" }],
                }))
              }
            >
              {form.subSkills.length === 0 ? (
                <EmptyHint>No sub-skills yet</EmptyHint>
              ) : (
                form.subSkills.map((sub, i) => (
                  <div key={sub.id} className="flex gap-2">
                    <input
                      value={sub.title}
                      onChange={(e) =>
                        setForm((f) => {
                          const subSkills = [...f.subSkills];
                          subSkills[i] = { ...subSkills[i]!, title: e.target.value };
                          return { ...f, subSkills };
                        })
                      }
                      placeholder="e.g. React, HTML"
                      className={cn(inputClass, "flex-1")}
                    />
                    <RemoveBtn
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          subSkills: f.subSkills.filter((s) => s.id !== sub.id),
                        }))
                      }
                    />
                  </div>
                ))
              )}
            </ListSection>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-bg)] disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {saving ? "Creating…" : "Create plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[var(--color-text-strong)]">
        {label}
        {required && <span className="text-[var(--color-danger)]">*</span>}
        {hint && (
          <span className="font-normal text-[var(--color-muted)]">({hint})</span>
        )}
      </span>
      {children}
    </label>
  );
}

function ListSection({
  title,
  icon,
  onAdd,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-strong)]">
          {icon}
          {title}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-[10px] text-[var(--color-accent)] hover:underline"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
      {children}
    </p>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-lg p-2 text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-400"
    >
      <Trash2 size={14} />
    </button>
  );
}
