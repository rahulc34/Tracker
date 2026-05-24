"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronRight,
  Code2,
  Folder,
  FolderOpen,
  Home,
  Plus,
  Settings,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { MONTH_SHORT } from "@/lib/constants";
import type { YearRecord } from "@/lib/types";

type MonthNav = { id: string; monthIndex: number };

export function ExplorerSidebar({
  years,
  monthsByYear = {},
  onAddYear,
  onNavigate,
  className,
}: {
  years: YearRecord[];
  monthsByYear?: Record<string, MonthNav[]>;
  onAddYear: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const activeMonthId = pathname.match(/^\/month\/([^/]+)/)?.[1];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  function isYearExpanded(yearId: string, months: MonthNav[]) {
    if (expanded[yearId] !== undefined) return expanded[yearId];
    if (pathname.startsWith(`/year/${yearId}`)) return true;
    if (activeMonthId && months.some((m) => m.id === activeMonthId)) return true;
    return false;
  }

  const navLinkClass = (active: boolean) =>
    cn(
      "flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors touch-manipulation",
      active
        ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
        : "text-[var(--color-text)] hover:bg-[var(--color-panel-elevated)] active:bg-[var(--color-panel-elevated)]",
    );

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--color-accent)]" />
          <span className="font-semibold text-[var(--color-text-strong)]">
            Pulse
          </span>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-panel-elevated)] lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Explorer
        </span>
        <Plus size={14} className="text-[var(--color-muted)]" />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <Link href="/" onClick={onNavigate} className={navLinkClass(pathname === "/")}>
          <Home size={16} />
          Root
        </Link>

        <div className="mt-4 px-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Workspace
          </span>
        </div>
        <Link
          href="/vault"
          onClick={onNavigate}
          className={navLinkClass(pathname === "/vault")}
        >
          <FolderOpen size={16} />
          File Vault
        </Link>
        <Link
          href="/profiles"
          onClick={onNavigate}
          className={navLinkClass(pathname === "/profiles")}
        >
          <Code2 size={16} />
          Coding Profiles
        </Link>

        <div className="mt-4 px-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Timeline
          </span>
        </div>

        {years.map((year) => {
          const months = monthsByYear[year.id] ?? [];
          const isYearOpen = isYearExpanded(year.id, months);

          return (
            <div key={year.id} className="mt-1">
              <button
                type="button"
                onClick={() => toggle(year.id)}
                className="flex min-h-[44px] w-full touch-manipulation items-center gap-1 rounded-lg px-2 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-panel-elevated)] active:bg-[var(--color-panel-elevated)]"
              >
                {isYearOpen ? (
                  <ChevronDown size={14} className="text-[var(--color-muted)]" />
                ) : (
                  <ChevronRight size={14} className="text-[var(--color-muted)]" />
                )}
                <Calendar size={14} className="text-[var(--color-muted)]" />
                <Link
                  href={`/year/${year.id}`}
                  className="flex-1 text-left hover:text-[var(--color-accent)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.();
                  }}
                >
                  {year.yearNumber}
                </Link>
              </button>

              {isYearOpen && (
                <div className="ml-5 space-y-0.5 border-l border-[var(--color-border)] pl-2">
                  <Link
                    href={`/year/${year.id}#yearly`}
                    onClick={onNavigate}
                    className="flex min-h-[40px] items-center gap-2 rounded px-2 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-yearly)]"
                  >
                    <Target size={12} />
                    Yearly Plans
                  </Link>
                  <Link
                    href={`/year/${year.id}#monthly-pool`}
                    onClick={onNavigate}
                    className="flex min-h-[40px] items-center gap-2 rounded px-2 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-monthly)]"
                  >
                    <Folder size={12} />
                    Monthly Goals Pool
                  </Link>
                  <div className="pt-1">
                    <span className="px-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                      Months
                    </span>
                    {months.map((m) => (
                      <Link
                        key={m.id}
                        href={`/month/${m.id}`}
                        onClick={onNavigate}
                        className={cn(
                          "flex min-h-[40px] items-center gap-2 rounded px-2 py-2 text-xs transition-colors touch-manipulation",
                          pathname === `/month/${m.id}`
                            ? "bg-[var(--color-month)]/15 text-[var(--color-month)]"
                            : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                        )}
                      >
                        {MONTH_SHORT[m.monthIndex - 1]}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAddYear}
          className="mt-3 flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2.5 text-xs text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <Plus size={14} />
          Add Year
        </button>
      </nav>

      <div className="border-t border-[var(--color-border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white">
            PS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[var(--color-text-strong)]">
              Piyush Sharma
            </p>
            <p className="truncate text-[10px] text-[var(--color-muted)]">
              Stay consistent.
            </p>
          </div>
          <Settings size={14} className="text-[var(--color-muted)]" />
        </div>
      </div>
    </aside>
  );
}
