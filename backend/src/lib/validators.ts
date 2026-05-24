import { z } from "zod";

export const createUserBody = z.object({
  name: z.string().min(1).max(120),
});

export const createYearBody = z.object({
  yearNumber: z.coerce.number().int().min(2000).max(2100),
  createMonths: z.boolean().default(true),
});

export const createMonthBody = z.object({
  monthIndex: z.coerce.number().int().min(1).max(12),
});

export const createSkillBody = z.object({
  scope: z.enum(["yearly", "monthly"]),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  tag: z.enum(["skill", "project", "personal"]).default("skill"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  isCompleted: z.boolean().default(false),
  estimatedDays: z.coerce.number().int().min(1).max(365).optional(),
  startedAt: z.string().datetime().optional(),
  sortOrder: z.coerce.number().int().default(0),
  parentSkillId: z.string().uuid().optional(),
});

export const updateSkillBody = createSkillBody.partial();

export const createResourceBody = z.object({
  type: z.enum(["folder", "link", "note", "file"]),
  title: z.string().min(1).max(200),
  url: z.string().url().optional(),
  content: z.string().max(50000).optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateResourceBody = createResourceBody.partial();

export const assignSkillBody = z.object({
  skillId: z.string().uuid(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
});

export const reassignBody = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newMonthId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export const updateAssignmentBody = z.object({
  status: z.enum(["in_progress", "completed", "overdue"]).optional(),
  currentTargetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const createEventBody = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventType: z.enum(["created", "reassigned", "completed"]),
  status: z.enum(["started", "incomplete", "in_progress", "completed"]),
  note: z.string().max(500).optional(),
});

export const createDatePinBody = z.object({
  pinnedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isReassignment: z.boolean().default(false),
});

export const skillListQuery = z.object({
  scope: z.enum(["yearly", "monthly"]).optional(),
  pool: z.enum(["available", "assigned", "all"]).default("all"),
});

export const bookmarkCategory = z.enum(["vault", "profile"]);

export const profilePlatform = z.enum([
  "leetcode",
  "gfg",
  "codeforces",
  "codechef",
  "linkedin",
]);

export const vaultPlatform = z.enum([
  "google_drive",
  "dropbox",
  "onedrive",
  "github",
  "notion",
  "custom",
]);

export const createVaultBookmarkBody = z
  .object({
    kind: z.enum(["folder", "link"]),
    parentId: z.string().uuid().optional(),
    platform: vaultPlatform.default("custom"),
    title: z.string().min(1).max(200),
    url: z.string().url().optional(),
    note: z.string().max(500).optional(),
    sortOrder: z.coerce.number().int().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "link" && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "url is required for links",
        path: ["url"],
      });
    }
  });

export const updateBookmarkBody = z.object({
  platform: vaultPlatform.optional(),
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const upsertProfileBookmarkBody = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  note: z.string().max(500).optional(),
});
