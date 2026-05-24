"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Folder,
  FolderOpen,
  FolderPlus,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, SectionHeader } from "@/components/ui/card";
import { PageSearchBar } from "@/components/ui/page-search-bar";
import { api } from "@/lib/api";
import {
  VAULT_PLATFORMS,
  vaultPlatformColor,
  vaultPlatformLabel,
  type VaultPlatformKey,
} from "@/lib/bookmarks";
import { cn } from "@/lib/cn";
import type { VaultBookmarkNode } from "@/lib/types";
import { countVaultMatches, filterVaultTree } from "@/lib/vault-search";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

type AddModalState =
  | { kind: "folder"; parentId: string | null }
  | { kind: "link"; parentId: string | null }
  | null;

export function VaultView() {
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState<AddModalState>(null);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["vault-bookmarks"],
    queryFn: api.getVaultBookmarks,
  });

  const remove = useMutation({
    mutationFn: api.deleteBookmark,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault-bookmarks"] }),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["vault-bookmarks"] });

  const tree = query.data?.tree ?? [];
  const totalCount = query.data?.items.length ?? 0;
  const filteredTree = useMemo(
    () => filterVaultTree(tree, search),
    [tree, search],
  );
  const matchCount = useMemo(
    () => countVaultMatches(tree, search),
    [tree, search],
  );
  const isSearching = search.trim().length > 0;

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--color-danger)]">
        Could not load file vault
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-strong)] md:text-2xl">
          File Vault
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Organize folders and links to Google Drive, cloud storage, and
          important files
        </p>
      </div>

      <PageSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search folders, links, notes, and platforms…"
      />

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <SectionHeader
            number={1}
            title="Storage & files"
            count={totalCount}
            subtitle={
              isSearching
                ? `${matchCount} match${matchCount === 1 ? "" : "es"} for "${search.trim()}"`
                : "Create folders and nest links inside them"
            }
            action={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAddModal({ kind: "folder", parentId: null })
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  <FolderPlus size={14} />
                  New folder
                </button>
                <button
                  type="button"
                  onClick={() => setAddModal({ kind: "link", parentId: null })}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-bg)]"
                >
                  <Plus size={14} />
                  Add link
                </button>
              </div>
            }
          />
        </div>

        {tree.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <FolderOpen size={32} className="text-[var(--color-muted)]" />
            <p className="text-sm text-[var(--color-muted)]">
              No folders or links yet. Create a folder or add your first link.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setAddModal({ kind: "folder", parentId: null })
                }
                className="rounded-lg border border-dashed border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text)] hover:border-[var(--color-accent)]"
              >
                New folder
              </button>
              <button
                type="button"
                onClick={() => setAddModal({ kind: "link", parentId: null })}
                className="rounded-lg border border-dashed border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-accent)] hover:border-[var(--color-accent)]"
              >
                Add link
              </button>
            </div>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              No folders or links match &ldquo;{search.trim()}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="py-2">
            {filteredTree.map((node) => (
              <VaultTreeNode
                key={node.id}
                node={node}
                depth={0}
                forceOpen={isSearching}
                removing={remove.isPending}
                onRemove={(id) => remove.mutate(id)}
                onAddFolder={(parentId) =>
                  setAddModal({ kind: "folder", parentId })
                }
                onAddLink={(parentId) =>
                  setAddModal({ kind: "link", parentId })
                }
              />
            ))}
          </div>
        )}
      </Card>

      {addModal && (
        <AddVaultModal
          kind={addModal.kind}
          parentId={addModal.parentId}
          onClose={() => setAddModal(null)}
          onSaved={() => {
            setAddModal(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function VaultTreeNode({
  node,
  depth,
  forceOpen = false,
  removing,
  onRemove,
  onAddFolder,
  onAddLink,
}: {
  node: VaultBookmarkNode;
  depth: number;
  forceOpen?: boolean;
  removing: boolean;
  onRemove: (id: string) => void;
  onAddFolder: (parentId: string) => void;
  onAddLink: (parentId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const isFolder = node.kind === "folder";
  const isOpen = forceOpen || open;

  if (isFolder) {
    return (
      <div>
        <div
          className="group flex items-start gap-2 px-3 py-2 hover:bg-[var(--color-panel-elevated)]/50"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-0.5 shrink-0 text-[var(--color-muted)]"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <Folder size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-strong)]">
              {node.title}
            </p>
            {node.note && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {node.note}
              </p>
            )}
            <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">
              {node.children.length}{" "}
              {node.children.length === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              title="New subfolder"
              onClick={() => onAddFolder(node.id)}
              className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)] hover:text-amber-400"
            >
              <FolderPlus size={14} />
            </button>
            <button
              type="button"
              title="Add link"
              onClick={() => onAddLink(node.id)}
              className="rounded p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)] hover:text-[var(--color-accent)]"
            >
              <Link2 size={14} />
            </button>
            <button
              type="button"
              disabled={removing}
              onClick={() => onRemove(node.id)}
              className="rounded p-1.5 text-[var(--color-muted)] hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {isOpen &&
          node.children.map((child) => (
            <VaultTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              forceOpen={forceOpen}
              removing={removing}
              onRemove={onRemove}
              onAddFolder={onAddFolder}
              onAddLink={onAddLink}
            />
          ))}
      </div>
    );
  }

  const color = vaultPlatformColor(node.platform);

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2 hover:bg-[var(--color-panel-elevated)]/50"
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {vaultPlatformLabel(node.platform).slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {node.url ? (
            <a
              href={node.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-strong)] hover:text-[var(--color-accent)]"
            >
              {node.title}
              <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-sm font-medium text-[var(--color-text-strong)]">
              {node.title}
            </span>
          )}
          <span className="rounded-md bg-[var(--color-panel-elevated)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {vaultPlatformLabel(node.platform)}
          </span>
        </div>
        {node.note && (
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{node.note}</p>
        )}
        {node.url && (
          <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]/80">
            {node.url}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={removing}
        onClick={() => onRemove(node.id)}
        className="shrink-0 rounded p-1.5 text-[var(--color-muted)] opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function AddVaultModal({
  kind,
  parentId,
  onClose,
  onSaved,
}: {
  kind: "folder" | "link";
  parentId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [platform, setPlatform] = useState<VaultPlatformKey>("google_drive");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.createVaultBookmark({
        kind,
        parentId: parentId ?? undefined,
        platform: kind === "link" ? platform : undefined,
        title: title.trim(),
        url: kind === "link" ? url.trim() : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: onSaved,
  });

  useEffect(() => {
    setPlatform("google_drive");
    setTitle("");
    setUrl("");
    setNote("");
  }, [kind, parentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave =
    title.trim().length > 0 && (kind === "folder" || url.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[var(--color-accent)]">
              {kind === "folder" ? (
                <FolderPlus size={16} />
              ) : (
                <Link2 size={16} />
              )}
              <span className="text-xs font-medium uppercase tracking-wide">
                {kind === "folder" ? "Folder" : "Link"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">
              {kind === "folder" ? "Create folder" : "Add link"}
              {parentId && (
                <span className="font-normal text-[var(--color-muted)]">
                  {" "}
                  inside folder
                </span>
              )}
            </h3>
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
            if (!canSave || create.isPending) return;
            create.mutate();
          }}
          className="space-y-3"
        >
          {kind === "link" && (
            <label className="block text-xs font-medium text-[var(--color-text-strong)]">
              Platform
              <select
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as VaultPlatformKey)
                }
                className={cn(inputClass, "mt-1.5")}
              >
                {VAULT_PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-xs font-medium text-[var(--color-text-strong)]">
            {kind === "folder" ? "Folder name" : "Title"}
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === "folder" ? "e.g. Resumes & CVs" : "e.g. Main Google Drive"
              }
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          {kind === "link" && (
            <label className="block text-xs font-medium text-[var(--color-text-strong)]">
              URL
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className={cn(inputClass, "mt-1.5")}
              />
            </label>
          )}

          <label className="block text-xs font-medium text-[var(--color-text-strong)]">
            Note <span className="text-[var(--color-muted)]">(optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                kind === "folder"
                  ? "What's inside this folder?"
                  : "What's stored here?"
              }
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="rounded-lg px-3 py-2 text-xs text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave || create.isPending}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-medium text-[var(--color-bg)] disabled:opacity-40"
            >
              {create.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : kind === "folder" ? (
                "Create folder"
              ) : (
                "Add link"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
