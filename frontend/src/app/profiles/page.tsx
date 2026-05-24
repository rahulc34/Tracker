"use client";

import { Suspense } from "react";
import { ProfilesView } from "@/components/planner/profiles-view";
import { PlannerShell } from "@/components/planner/planner-shell";

export default function ProfilesPage() {
  return (
    <Suspense
      fallback={
        <PlannerShell crumbs={[{ label: "Coding Profiles" }]}>
          <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
            Loading…
          </div>
        </PlannerShell>
      }
    >
      <PlannerShell crumbs={[{ label: "Coding Profiles" }]}>
        <ProfilesView />
      </PlannerShell>
    </Suspense>
  );
}
