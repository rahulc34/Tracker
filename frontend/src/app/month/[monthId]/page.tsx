"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { MonthView } from "@/components/planner/month-view";
import { PlannerShell } from "@/components/planner/planner-shell";
import { MONTH_NAMES } from "@/lib/constants";
import { api } from "@/lib/api";

export default function MonthPage({
  params,
}: {
  params: Promise<{ monthId: string }>;
}) {
  const { monthId } = use(params);

  const overview = useQuery({
    queryKey: ["month-overview", monthId],
    queryFn: () => api.getMonthOverview(monthId),
  });

  if (overview.isLoading) {
    return (
      <PlannerShell
        crumbs={[
          { label: "Root", href: "/" },
          { label: "…" },
          { label: "Month" },
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
      <PlannerShell crumbs={[{ label: "Root", href: "/" }, { label: "Month" }]}>
        <div className="p-6 text-[var(--color-danger)]">Month not found</div>
      </PlannerShell>
    );
  }

  const monthName = MONTH_NAMES[overview.data.monthIndex - 1];

  return (
    <PlannerShell
      crumbs={[
        { label: "Root", href: "/" },
        {
          label: String(overview.data.yearNumber),
          href: `/year/${overview.data.yearId}`,
        },
        { label: "Months" },
        { label: monthName ?? "Month" },
      ]}
    >
      <MonthView monthId={monthId} data={overview.data} />
    </PlannerShell>
  );
}
