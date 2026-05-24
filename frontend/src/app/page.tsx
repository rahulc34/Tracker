"use client";

import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { RootView } from "@/components/planner/root-view";
import { PlannerShell } from "@/components/planner/planner-shell";
import { useOpenAddYear } from "@/lib/add-year-context";
import { api } from "@/lib/api";

function RootPageContent() {
  const openAddYear = useOpenAddYear();

  const overview = useQuery({
    queryKey: ["root-overview"],
    queryFn: api.getRootOverview,
  });

  if (overview.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }

  if (overview.isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-[var(--color-danger)]">Could not load data</p>
        <p className="text-sm text-[var(--color-muted)]">
          Make sure Tracker backend is running on port 4001 and seeded.
        </p>
        <code className="rounded bg-[var(--color-panel)] px-3 py-1 text-xs">
          npm run dev:tracker-backend
        </code>
      </div>
    );
  }

  return <RootView data={overview.data!} onAddYear={openAddYear} />;
}

function HomeContent() {
  return (
    <PlannerShell crumbs={[{ label: "Root" }]}>
      <RootPageContent />
    </PlannerShell>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <PlannerShell crumbs={[{ label: "Root" }]}>
          <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
            Loading…
          </div>
        </PlannerShell>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
