import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.trackerUser.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { name: "Piyush Sharma" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Piyush Sharma",
    },
  });

  const year2025 = await prisma.year.upsert({
    where: {
      userId_yearNumber: { userId: user.id, yearNumber: 2025 },
    },
    update: {},
    create: {
      userId: user.id,
      yearNumber: 2025,
      months: {
        create: Array.from({ length: 12 }, (_, i) => ({ monthIndex: i + 1 })),
      },
    },
    include: { months: true },
  });

  const jan = year2025.months.find((m) => m.monthIndex === 1)!;

  const learnFrontend = await prisma.skill.create({
    data: {
      yearId: year2025.id,
      scope: "yearly",
      title: "Learn Frontend",
      progress: 45,
      tag: "skill",
      startedAt: new Date("2025-01-01"),
      subSkills: {
        create: [
          { yearId: year2025.id, scope: "yearly", title: "HTML", progress: 100, isCompleted: true, sortOrder: 1 },
          { yearId: year2025.id, scope: "yearly", title: "CSS", progress: 80, sortOrder: 2 },
          { yearId: year2025.id, scope: "yearly", title: "React", progress: 30, sortOrder: 3 },
          { yearId: year2025.id, scope: "yearly", title: "Next.js", progress: 0, sortOrder: 4 },
        ],
      },
      resources: {
        create: [
          { type: "link", title: "roadmap.sh", url: "https://roadmap.sh/frontend", sortOrder: 1 },
          { type: "link", title: "React docs", url: "https://react.dev", sortOrder: 2 },
          { type: "note", title: "Week 1 notes", content: "Set up environment and tooling.", sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.skill.createMany({
    data: [
      {
        yearId: year2025.id,
        scope: "yearly",
        title: "Learn Backend",
        progress: 20,
        sortOrder: 2,
      },
      {
        yearId: year2025.id,
        scope: "yearly",
        title: "DSA + System Design",
        progress: 10,
        sortOrder: 3,
      },
    ],
  });

  const bashSkill = await prisma.skill.create({
    data: {
      yearId: year2025.id,
      scope: "monthly",
      title: "Complete Bash scripting",
      progress: 100,
      isCompleted: true,
      estimatedDays: 7,
      sortOrder: 1,
      subSkills: {
        create: [
          { yearId: year2025.id, scope: "monthly", title: "Variables", progress: 100, isCompleted: true, sortOrder: 1 },
          { yearId: year2025.id, scope: "monthly", title: "Loops", progress: 100, isCompleted: true, sortOrder: 2 },
        ],
      },
    },
  });

  const cliSkill = await prisma.skill.create({
    data: {
      yearId: year2025.id,
      scope: "monthly",
      title: "Build CLI module",
      progress: 20,
      estimatedDays: 14,
      sortOrder: 2,
    },
  });

  await prisma.monthAssignment.create({
    data: {
      skillId: bashSkill.id,
      monthId: jan.id,
      status: "completed",
      currentTargetDate: new Date("2025-01-12"),
      events: {
        create: [
          {
            eventDate: new Date("2025-01-05"),
            eventType: "created",
            status: "started",
            sequence: 1,
          },
          {
            eventDate: new Date("2025-01-12"),
            eventType: "completed",
            status: "completed",
            sequence: 2,
          },
        ],
      },
      datePins: {
        create: [
          { pinnedDate: new Date("2025-01-05"), isReassignment: false },
          { pinnedDate: new Date("2025-01-12"), isReassignment: false },
        ],
      },
    },
  });

  await prisma.monthAssignment.create({
    data: {
      skillId: cliSkill.id,
      monthId: jan.id,
      status: "in_progress",
      currentTargetDate: new Date("2025-01-22"),
      events: {
        create: [
          {
            eventDate: new Date("2025-01-08"),
            eventType: "created",
            status: "started",
            sequence: 1,
          },
          {
            eventDate: new Date("2025-01-15"),
            eventType: "reassigned",
            status: "incomplete",
            sequence: 2,
            note: "moved forward",
          },
          {
            eventDate: new Date("2025-01-22"),
            eventType: "reassigned",
            status: "in_progress",
            sequence: 3,
          },
        ],
      },
      datePins: {
        create: [
          { pinnedDate: new Date("2025-01-08"), isReassignment: false },
          { pinnedDate: new Date("2025-01-15"), isReassignment: true },
          { pinnedDate: new Date("2025-01-22"), isReassignment: true },
        ],
      },
    },
  });

  console.log("Seed complete:", { userId: user.id, yearId: year2025.id, learnFrontendId: learnFrontend.id });

  await prisma.userBookmark.deleteMany({ where: { userId: user.id } });

  const cloudFolder = await prisma.userBookmark.create({
    data: {
      userId: user.id,
      category: "vault",
      kind: "folder",
      platform: "folder",
      title: "Cloud storage",
      note: "Drive, Notion, and shared folders",
      sortOrder: 1,
    },
  });

  await prisma.userBookmark.createMany({
    data: [
      {
        userId: user.id,
        category: "vault",
        kind: "link",
        parentId: cloudFolder.id,
        platform: "google_drive",
        title: "Main Google Drive",
        url: "https://drive.google.com",
        note: "Important docs, resumes, and project files",
        sortOrder: 1,
      },
      {
        userId: user.id,
        category: "vault",
        kind: "link",
        parentId: cloudFolder.id,
        platform: "notion",
        title: "Notes workspace",
        url: "https://notion.so",
        note: "Study notes and planning docs",
        sortOrder: 2,
      },
      {
        userId: user.id,
        category: "vault",
        kind: "link",
        platform: "github",
        title: "GitHub repos",
        url: "https://github.com",
        sortOrder: 2,
      },
      {
        userId: user.id,
        category: "profile",
        kind: "link",
        platform: "leetcode",
        title: "piyush-sharma",
        url: "https://leetcode.com/u/piyush-sharma",
        sortOrder: 1,
      },
      {
        userId: user.id,
        category: "profile",
        kind: "link",
        platform: "linkedin",
        title: "Piyush Sharma",
        url: "https://linkedin.com/in/piyush-sharma",
        sortOrder: 5,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
