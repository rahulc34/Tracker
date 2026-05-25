"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/contexts/auth-context";
import { cn } from "@/lib/cn";

export function PlannerSearch({
  className,
  onResultClick,
}: {
  className?: string;
  onResultClick?: () => void;
}) {
  const api = useApi();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const indexQuery = useQuery({
    queryKey: ["plan-search-index", api.userId],
    queryFn: () => api.getPlanSearchIndex(),
    staleTime: 60_000,
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !indexQuery.data) return [];
    return indexQuery.data
      .filter((hit) => {
        if (hit.title.toLowerCase().includes(q)) return true;
        if (hit.parentTitle?.toLowerCase().includes(q)) return true;
        return false;
      })
      .slice(0, 12);
  }, [query, indexQuery.data]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative mx-auto max-w-md flex-1", className)}>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5">
        <Search size={14} className="shrink-0 text-[var(--color-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search plans and sub-skills…"
          className="w-full bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-xl">
          {indexQuery.isLoading && (
            <p className="px-3 py-2 text-xs text-[var(--color-muted)]">Loading…</p>
          )}
          {indexQuery.isError && (
            <p className="px-3 py-2 text-xs text-[var(--color-danger)]">
              Could not load search index
            </p>
          )}
          {!indexQuery.isLoading && !indexQuery.isError && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--color-muted)]">
              No plans or sub-skills found
            </p>
          )}
          {results.map((hit) => (
            <Link
              key={`${hit.kind}-${hit.id}`}
              href={hit.href as never}
              onClick={() => {
                setOpen(false);
                setQuery("");
                onResultClick?.();
              }}
              className="block px-3 py-2 hover:bg-[var(--color-panel-elevated)]"
            >
              <p className="text-sm font-medium text-[var(--color-text-strong)]">
                {hit.title}
              </p>
              <p className="text-[10px] text-[var(--color-muted)]">
                {hit.kind}
                {hit.parentTitle ? ` · ${hit.parentTitle}` : ""}
                {" · "}
                {hit.yearNumber}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
