import type { PrismaClient, Skill as SkillModel } from "../generated/prisma/client.js";

export function averageProgress(items: { progress: number }[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + item.progress, 0);
  return Math.round(sum / items.length);
}

/** Recompute parent skill progress + isCompleted from its sub-skills. */
export async function syncParentFromSubSkills(
  prisma: PrismaClient,
  parentSkillId: string,
) {
  const subSkills = await prisma.skill.findMany({
    where: { parentSkillId },
  });
  if (subSkills.length === 0) return null;

  const progress = averageProgress(subSkills);
  const isCompleted = subSkills.every((s) => s.isCompleted);

  const updated = await prisma.skill.update({
    where: { id: parentSkillId },
    data: { progress, isCompleted },
  });

  if (isCompleted) {
    await syncAssignmentOnSkillComplete(prisma, parentSkillId);
  }

  return updated;
}

/** Top-level skills only (yearly + monthly plans, not sub-skills). */
export function isTopLevelSkill(skill: Pick<SkillModel, "parentSkillId">): boolean {
  return skill.parentSkillId === null;
}

export async function getTopLevelSkillsForYear(
  prisma: PrismaClient,
  yearId: string,
) {
  return prisma.skill.findMany({
    where: { yearId, parentSkillId: null },
  });
}

export async function getYearProgress(prisma: PrismaClient, yearId: string) {
  const skills = await getTopLevelSkillsForYear(prisma, yearId);
  return averageProgress(skills);
}

export async function getMonthProgress(prisma: PrismaClient, monthId: string) {
  const assignments = await prisma.monthAssignment.findMany({
    where: { monthId },
    include: { skill: true },
  });
  return averageProgress(assignments.map((a) => a.skill));
}

export async function getRootOverview(prisma: PrismaClient, userId: string) {
  const years = await prisma.year.findMany({
    where: { userId },
    orderBy: { yearNumber: "desc" },
    include: {
      months: { orderBy: { monthIndex: "asc" } },
      skills: { where: { parentSkillId: null } },
    },
  });

  const allSkills = years.flatMap((y) => y.skills);
  const completed = allSkills.filter((s) => s.isCompleted).length;

  const yearSummaries = await Promise.all(
    years.map(async (year) => {
      const yearlyCount = year.skills.filter((s) => s.scope === "yearly").length;
      const monthlyCount = year.skills.filter((s) => s.scope === "monthly").length;
      const activeMonths = year.months.filter((m) => m.isActive).length;

      const monthTracks = await Promise.all(
        year.months.map(async (month) => ({
          monthId: month.id,
          monthIndex: month.monthIndex,
          progress: await getMonthProgress(prisma, month.id),
        })),
      );

      return {
        id: year.id,
        yearNumber: year.yearNumber,
        progress: averageProgress(year.skills),
        yearlySkillCount: yearlyCount,
        monthlySkillCount: monthlyCount,
        activeMonthCount: activeMonths,
        monthTracks,
      };
    }),
  );

  return {
    overallProgress: averageProgress(allSkills),
    activeYearCount: years.length,
    completedSkillCount: completed,
    totalSkillCount: allSkills.length,
    years: yearSummaries,
  };
}

export async function getYearOverview(prisma: PrismaClient, yearId: string) {
  const year = await prisma.year.findUnique({
    where: { id: yearId },
    include: {
      months: { orderBy: { monthIndex: "asc" } },
      skills: {
        where: { parentSkillId: null },
        include: {
          resources: true,
          subSkills: true,
          assignments: { include: { month: true } },
        },
        orderBy: [{ scope: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!year) return null;

  const monthTracks = await Promise.all(
    year.months.map(async (month) => ({
      ...month,
      progress: await getMonthProgress(prisma, month.id),
    })),
  );

  const assignedSkillIds = new Set(
    year.skills
      .flatMap((s) => s.assignments.map((a) => a.skillId)),
  );

  const yearlyPlans = year.skills.filter((s) => s.scope === "yearly");
  const monthlyPlans = year.skills.filter((s) => s.scope === "monthly");
  const assignedMonthly = monthlyPlans.filter((s) => s.assignments.length > 0);

  return {
    id: year.id,
    yearNumber: year.yearNumber,
    progress: averageProgress(year.skills),
    monthTracks,
    yearlyPlans: yearlyPlans.map(enrichSkillSummary),
    monthlyPool: monthlyPlans.map(enrichSkillSummary),
    assignedMonthlyCount: assignedMonthly.length,
    assignedSkillIds: [...assignedSkillIds],
  };
}

/** Mark in-progress assignments overdue when target date has passed. */
export async function syncOverdueAssignments(
  prisma: PrismaClient,
  monthId: string,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.monthAssignment.updateMany({
    where: {
      monthId,
      status: "in_progress",
      currentTargetDate: { lt: today },
      skill: { isCompleted: false },
    },
    data: { status: "overdue" },
  });
}

/** Close open assignments and append a completed timeline event. */
export async function syncAssignmentOnSkillComplete(
  prisma: PrismaClient,
  skillId: string,
) {
  const today = new Date();
  const assignments = await prisma.monthAssignment.findMany({
    where: {
      skillId,
      status: { in: ["in_progress", "overdue"] },
    },
    include: { events: true },
  });

  for (const assignment of assignments) {
    const nextSequence =
      assignment.events.reduce((max, e) => Math.max(max, e.sequence), 0) + 1;
    await prisma.$transaction([
      prisma.monthAssignment.update({
        where: { id: assignment.id },
        data: { status: "completed" },
      }),
      prisma.assignmentEvent.create({
        data: {
          assignmentId: assignment.id,
          eventDate: today,
          eventType: "completed",
          status: "completed",
          sequence: nextSequence,
        },
      }),
    ]);
  }
}

export async function getMonthOverview(prisma: PrismaClient, monthId: string) {
  await syncOverdueAssignments(prisma, monthId);

  const month = await prisma.month.findUnique({
    where: { id: monthId },
    include: {
      year: true,
      assignments: {
        include: {
          skill: {
            include: {
              subSkills: true,
              resources: true,
            },
          },
          events: { orderBy: { sequence: "asc" } },
          datePins: { orderBy: { pinnedDate: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!month) return null;

  const assignments = month.assignments;
  const completedCount = assignments.filter(
    (a) => a.status === "completed" || a.skill.isCompleted,
  ).length;
  const inProgressCount = assignments.filter(
    (a) => a.status === "in_progress" && !a.skill.isCompleted,
  ).length;
  const overdueCount = assignments.filter((a) => a.status === "overdue").length;

  const poolSkills = await prisma.skill.findMany({
    where: {
      yearId: month.yearId,
      scope: "monthly",
      parentSkillId: null,
      assignments: { none: {} },
    },
    include: { subSkills: true, resources: true },
  });

  const overdueAssignments = assignments.filter((a) => a.status === "overdue");

  return {
    id: month.id,
    monthIndex: month.monthIndex,
    yearId: month.yearId,
    yearNumber: month.year.yearNumber,
    progress: averageProgress(assignments.map((a) => a.skill)),
    assignedCount: assignments.length,
    completedCount,
    inProgressCount,
    overdueCount,
    assignments: assignments.map((a) => ({
      ...a,
      skill: enrichSkillSummary(a.skill),
    })),
    poolSkills: poolSkills.map(enrichSkillSummary),
    unfinishedToSchedule: [...poolSkills, ...overdueAssignments.map((a) => a.skill)],
    datePins: assignments.flatMap((a) =>
      a.datePins.map((pin) => ({
        ...pin,
        skillId: a.skillId,
        skillTitle: a.skill.title,
        assignmentId: a.id,
      })),
    ),
  };
}

function enrichSkillSummary(
  skill: SkillModel & {
    resources?: { id: string; type: string }[];
    subSkills?: { id: string; title: string; progress: number; isCompleted: boolean }[];
  },
) {
  const resources = skill.resources ?? [];
  const subSkills = skill.subSkills ?? [];
  return {
    ...skill,
    linkCount: resources.filter((r) => r.type === "link").length,
    noteCount:
      resources.filter((r) => r.type === "note" || r.type === "file").length,
    resourceCount: resources.length,
    subSkillTags: subSkills.map((s) => s.title),
    subSkills,
    resources,
  };
}

export function buildResourceTree<
  T extends {
    id: string;
    parentId: string | null;
    sortOrder: number;
  },
>(items: T[]) {
  const byParent = new Map<string | null, T[]>();
  for (const item of items) {
    const key = item.parentId;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  type Node = T & { children: Node[] };
  function nest(parentId: string | null): Node[] {
    return (byParent.get(parentId) ?? []).map((item) => ({
      ...item,
      children: nest(item.id),
    }));
  }
  return nest(null);
}
