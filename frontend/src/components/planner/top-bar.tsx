"use client";

import Link from "next/link";
import { ChevronRight, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { PlannerSearch } from "@/components/planner/planner-search";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

export function TopBar({
  crumbs,
  onMenuClick,
}: {
  crumbs: Crumb[];
  onMenuClick?: () => void;
}) {
  const { trackerUser, signOut } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileCrumbs =
    crumbs.length > 2 ? [crumbs[0]!, crumbs[crumbs.length - 1]!] : crumbs;

  return (
    <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 md:gap-4 md:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg text-[var(--color-text)] hover:bg-[var(--color-panel)] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="hidden items-center gap-1 md:flex">
            {crumbs.map((crumb, i) => (
              <span
                key={`${crumb.label}-${i}`}
                className="flex shrink-0 items-center gap-1"
              >
                {i > 0 && (
                  <ChevronRight size={14} className="text-[var(--color-muted)]" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href as never}
                    className="truncate text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-[var(--color-text-strong)]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </span>
          <span className="flex min-w-0 items-center gap-1 md:hidden">
            {mobileCrumbs.map((crumb, i) => (
              <span
                key={`${crumb.label}-m-${i}`}
                className="flex min-w-0 items-center gap-1"
              >
                {i > 0 && crumbs.length > 2 && (
                  <>
                    <ChevronRight size={14} className="shrink-0 text-[var(--color-muted)]" />
                    <span className="shrink-0 text-[var(--color-muted)]">…</span>
                    <ChevronRight size={14} className="shrink-0 text-[var(--color-muted)]" />
                  </>
                )}
                {i > 0 && crumbs.length <= 2 && (
                  <ChevronRight size={14} className="shrink-0 text-[var(--color-muted)]" />
                )}
                {crumb.href && i < mobileCrumbs.length - 1 ? (
                  <Link
                    href={crumb.href as never}
                    className="truncate text-[var(--color-muted)]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-[var(--color-text-strong)]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </span>
        </nav>

        <button
          type="button"
          onClick={() => setMobileSearchOpen((v) => !v)}
          className={cn(
            "flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg md:hidden",
            mobileSearchOpen
              ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
              : "text-[var(--color-muted)] hover:bg-[var(--color-panel)]",
          )}
          aria-label={mobileSearchOpen ? "Close search" : "Open search"}
        >
          {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        <PlannerSearch className="hidden md:flex" />

        {trackerUser && (
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <span
              className="max-w-[140px] truncate text-xs text-[var(--color-muted)]"
              title={trackerUser.email ?? trackerUser.name}
            >
              {trackerUser.name}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-[var(--color-border)] px-3 py-3 md:hidden">
          <PlannerSearch className="w-full max-w-none" onResultClick={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}
