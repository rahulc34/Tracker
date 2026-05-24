"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { SkillView } from "@/components/planner/skill-view";
import { PlannerShell } from "@/components/planner/planner-shell";
import { api } from "@/lib/api";

export default function SkillPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = use(params);

  const skill = useQuery({
    queryKey: ["skill", skillId],
    queryFn: () => api.getSkill(skillId),
  });

  if (skill.isLoading) {
    return (
      <PlannerShell
        crumbs={[
          { label: "Root", href: "/" },
          { label: "…" },
          { label: "Skill" },
        ]}
      >
        <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
          Loading…
        </div>
      </PlannerShell>
    );
  }

  if (skill.isError || !skill.data) {
    return (
      <PlannerShell crumbs={[{ label: "Root", href: "/" }, { label: "Skill" }]}>
        <div className="p-6 text-[var(--color-danger)]">Skill not found</div>
      </PlannerShell>
    );
  }

  const s = skill.data;
  const section =
    s.scope === "yearly" ? "Yearly Plans" : "Monthly Goals Pool";

  return (
    <PlannerShell
      crumbs={[
        { label: "Root", href: "/" },
        {
          label: String(s.year.yearNumber),
          href: `/year/${s.year.id}`,
        },
        { label: section },
        { label: s.title },
      ]}
    >
      <SkillView skill={s} />
    </PlannerShell>
  );
}
