"use client";

import { Suspense } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { VaultView } from "@/components/planner/vault-view";
import { PlannerShell } from "@/components/planner/planner-shell";

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <PlannerShell crumbs={[{ label: "File Vault" }]}>
          <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
            Loading…
          </div>
        </PlannerShell>
      }
    >
      <PlannerShell crumbs={[{ label: "File Vault" }]}>
        <AuthGate>
          <VaultView />
        </AuthGate>
      </PlannerShell>
    </Suspense>
  );
}
