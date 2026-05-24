"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { YearView } from "@/components/planner/year-view";
import { PlannerShell } from "@/components/planner/planner-shell";
import { api } from "@/lib/api";

export default function YearPage({
  params,
}: {
  params: Promise<{ yearId: string }>;
}) {
  const { yearId } = use(params);

  const overview = useQuery({
    queryKey: ["year-overview", yearId],
    queryFn: () => api.getYearOverview(yearId),
  });

  if (overview.isLoading) {
    return (
      <PlannerShell
        crumbs={[
          { label: "Root", href: "/" },
          { label: "…" },
        ]}
      >
        <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
          Loading…
        </div>
      </PlannerShell>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <PlannerShell crumbs={[{ label: "Root", href: "/" }, { label: "Year" }]}>
        <div className="p-6 text-[var(--color-danger)]">Year not found</div>
      </PlannerShell>
    );
  }

  return (
    <PlannerShell
      crumbs={[
        { label: "Root", href: "/" },
        { label: String(overview.data.yearNumber) },
      ]}
    >
      <YearView yearId={yearId} data={overview.data} />
    </PlannerShell>
  );
}
