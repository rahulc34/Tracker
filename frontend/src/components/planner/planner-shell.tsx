"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExplorerSidebar } from "@/components/planner/explorer-sidebar";
import { TopBar } from "@/components/planner/top-bar";
import { AddYearProvider, useOpenAddYear } from "@/lib/add-year-context";
import { useAuth } from "@/contexts/auth-context";
import { getApiBase } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Crumb } from "@/components/planner/top-bar";

function PlannerShellInner({
  api,
  crumbs,
  children,
}: {
  api: NonNullable<ReturnType<typeof useAuth>["api"]>;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const openAddYear = useOpenAddYear();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const yearsQuery = useQuery({
    queryKey: ["years", api.userId],
    queryFn: () => api.getYears(),
  });

  const monthsQueries = useQuery({
    queryKey: ["all-months", api.userId, yearsQuery.data?.map((y) => y.id)],
    enabled: !!yearsQuery.data?.length,
    queryFn: async () => {
      const years = yearsQuery.data ?? [];
      const entries = await Promise.all(
        years.map(async (y) => {
          const months = await api.getYearMonths(y.id);
          return [y.id, months] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--color-bg)]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <ExplorerSidebar
        years={yearsQuery.data ?? []}
        monthsByYear={monthsQueries.data ?? {}}
        onAddYear={openAddYear}
        onNavigate={closeSidebar}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(288px,88vw)] transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-[260px] lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar crumbs={crumbs} onMenuClick={openSidebar} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PlannerShell({
  crumbs,
  children,
}: {
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  const { api, loading, session, syncError } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--color-bg)] text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  if (!api) {
    if (!isSupabaseConfigured()) {
      return (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--color-bg)] p-6 text-center">
          <p className="text-[var(--color-text-strong)]">Supabase not configured</p>
          <p className="max-w-md text-sm text-[var(--color-muted)]">
            Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="text-xs">frontend/.env.local</code>, then restart{" "}
            <code className="text-xs">npm run dev</code>.
          </p>
        </div>
      );
    }

    if (session && syncError) {
      const apiBase = getApiBase();
      const isLocalDev =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
      return (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--color-bg)] p-6 text-center">
          <p className="text-[var(--color-text-strong)]">Signed in, but API sync failed</p>
          <p className="max-w-md text-sm text-[var(--color-danger)]">{syncError}</p>
          <p className="max-w-md text-xs text-[var(--color-muted)]">
            API URL in this build: <code className="text-xs">{apiBase}</code>
          </p>
          {isLocalDev ? (
            <p className="max-w-md text-xs text-[var(--color-muted)]">
              Start the backend: <code className="text-xs">npm run dev:backend</code>
              . Run migrations:{" "}
              <code className="text-xs">npm run prisma:migrate</code>.
            </p>
          ) : (
            <p className="max-w-md text-xs text-[var(--color-muted)]">
              On Render → <strong>tracker-web</strong> → Environment, set{" "}
              <code className="text-xs">NEXT_PUBLIC_TRACKER_API_URL</code> to your live API
              (e.g. <code className="text-xs">https://tracker-api-mb13.onrender.com</code>
              ), then <strong>Manual Deploy → Clear build cache & deploy</strong>.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-[var(--color-bg)] p-6 text-center">
        <p className="text-[var(--color-text-strong)]">Sign in required</p>
        <Link
          href="/login"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#042f2e]"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <PlannerShellWithApi api={api} crumbs={crumbs}>
      {children}
    </PlannerShellWithApi>
  );
}

function PlannerShellWithApi({
  api,
  crumbs,
  children,
}: {
  api: NonNullable<ReturnType<typeof useAuth>["api"]>;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  const yearsQuery = useQuery({
    queryKey: ["years", api.userId],
    queryFn: () => api.getYears(),
  });

  const existingYears = (yearsQuery.data ?? []).map((y) => y.yearNumber);

  return (
    <AddYearProvider existingYears={existingYears}>
      <PlannerShellInner api={api} crumbs={crumbs}>
        {children}
      </PlannerShellInner>
    </AddYearProvider>
  );
}
