"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExplorerSidebar } from "@/components/planner/explorer-sidebar";
import { TopBar } from "@/components/planner/top-bar";
import { AddYearProvider, useOpenAddYear } from "@/lib/add-year-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Crumb } from "@/components/planner/top-bar";

function PlannerShellInner({
  crumbs,
  children,
}: {
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
    queryKey: ["years"],
    queryFn: api.getYears,
  });

  const monthsQueries = useQuery({
    queryKey: ["all-months", yearsQuery.data?.map((y) => y.id)],
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
  const yearsQuery = useQuery({
    queryKey: ["years"],
    queryFn: api.getYears,
  });

  const existingYears = (yearsQuery.data ?? []).map((y) => y.yearNumber);

  return (
    <AddYearProvider existingYears={existingYears}>
      <PlannerShellInner crumbs={crumbs}>{children}</PlannerShellInner>
    </AddYearProvider>
  );
}
