"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageSearchBar } from "@/components/ui/page-search-bar";
import {
  PlatformIcon,
  PlatformIconBadge,
  profilePlatformColor,
} from "@/components/ui/platform-icons";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { PROFILE_PLATFORMS, type ProfilePlatformKey } from "@/lib/bookmarks";
import { cn } from "@/lib/cn";
import type { UserBookmark } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

export function ProfilesView() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProfilePlatformKey | null>(null);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["profile-bookmarks"],
    queryFn: api.getProfileBookmarks,
  });

  const byPlatform = useMemo(() => {
    const map = new Map<string, UserBookmark>();
    for (const b of query.data ?? []) {
      map.set(b.platform, b);
    }
    return map;
  }, [query.data]);

  const filteredPlatforms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PROFILE_PLATFORMS;

    return PROFILE_PLATFORMS.filter((platform) => {
      const saved = byPlatform.get(platform.key);
      const haystack = [
        platform.label,
        platform.key,
        platform.hint,
        saved?.title ?? "",
        saved?.url ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, byPlatform]);

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
        Could not load profiles
      </div>
    );
  }

  const connectedCount = PROFILE_PLATFORMS.filter((p) =>
    byPlatform.has(p.key),
  ).length;

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-strong)] md:text-2xl">
          Coding Profiles
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          LeetCode, GFG, Codeforces, CodeChef, and LinkedIn — all in one place
        </p>
      </div>

      <PageSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search profiles by platform, handle, or URL…"
      />

      {filteredPlatforms.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No profiles match &ldquo;{search.trim()}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs text-[var(--color-accent)] hover:underline"
          >
            Clear search
          </button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPlatforms.map((platform) => {
            const saved = byPlatform.get(platform.key);
            return (
              <ProfileCard
                key={platform.key}
                platform={platform}
                saved={saved}
                onEdit={() => setEditing(platform.key)}
              />
            );
          })}
        </div>
      )}

      <Card className="p-4">
        <p className="text-xs text-[var(--color-muted)]">
          {connectedCount} of {PROFILE_PLATFORMS.length} profiles connected.
          {search.trim() && (
            <span>
              {" "}
              Showing {filteredPlatforms.length} match
              {filteredPlatforms.length === 1 ? "" : "es"}.
            </span>
          )}{" "}
          Click a card to add or update your profile link.
        </p>
      </Card>

      {editing && (
        <EditProfileModal
          platformKey={editing}
          platform={PROFILE_PLATFORMS.find((p) => p.key === editing)!}
          saved={byPlatform.get(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["profile-bookmarks"] });
          }}
        />
      )}
    </div>
  );
}

function ProfileCard({
  platform,
  saved,
  onEdit,
}: {
  platform: (typeof PROFILE_PLATFORMS)[number];
  saved?: UserBookmark;
  onEdit: () => void;
}) {
  const connected = !!saved?.url;
  const color = profilePlatformColor(platform.key);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-black/20",
        connected ? "border-[var(--color-border)]" : "border-dashed",
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
      />
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07]"
        style={{ backgroundColor: color }}
      />
      <div className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <PlatformIconBadge platform={platform.key} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-bold"
                style={{ color }}
              >
                {platform.label}
              </p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  connected
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-[var(--color-panel-elevated)] text-[var(--color-muted)]",
                )}
              >
                {connected ? "Connected" : "Empty"}
              </span>
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-[var(--color-text-strong)]">
              {connected ? saved!.title : "Not connected"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-[var(--color-muted)] opacity-0 transition-opacity hover:bg-[var(--color-panel-elevated)] hover:text-[var(--color-text)] group-hover:opacity-100"
            aria-label={`Edit ${platform.label}`}
          >
            <Pencil size={14} />
          </button>
        </div>

        {connected ? (
          <>
            <a
              href={saved!.url!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: `${color}18`,
                color,
                border: `1px solid ${color}33`,
              }}
            >
              <PlatformIcon platform={platform.key} size={14} />
              Open profile
              <ExternalLink size={12} />
            </a>
            <p className="mt-2 truncate text-[11px] text-[var(--color-muted)]">
              {saved!.url}
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color }}
          >
            <PlatformIcon platform={platform.key} size={14} />
            Add your {platform.label} link
          </button>
        )}
      </div>
    </Card>
  );
}

function EditProfileModal({
  platformKey,
  platform,
  saved,
  onClose,
  onSaved,
}: {
  platformKey: ProfilePlatformKey;
  platform: (typeof PROFILE_PLATFORMS)[number];
  saved?: UserBookmark;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(saved?.title ?? "");
  const [url, setUrl] = useState(saved?.url ?? "");
  const color = profilePlatformColor(platformKey);

  const save = useMutation({
    mutationFn: () =>
      api.upsertProfileBookmark(platformKey, {
        title: title.trim(),
        url: url.trim(),
      }),
    onSuccess: onSaved,
  });

  useEffect(() => {
    setTitle(saved?.title ?? "");
    setUrl(saved?.url ?? "");
  }, [saved, platformKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSave = title.trim().length > 0 && url.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <PlatformIconBadge platform={platformKey} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color }}>
              {platform.label}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-[var(--color-text-strong)]">
              {saved ? "Update profile" : "Connect profile"}
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
            if (!canSave || save.isPending) return;
            save.mutate();
          }}
          className="space-y-3"
        >
          <label className="block text-xs font-medium text-[var(--color-text-strong)]">
            Display name / handle
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="your-username"
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <label className="block text-xs font-medium text-[var(--color-text-strong)]">
            Profile URL
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={platform.hint}
              className={cn(inputClass, "mt-1.5")}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              className="rounded-lg px-3 py-2 text-xs text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave || save.isPending}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              {save.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
