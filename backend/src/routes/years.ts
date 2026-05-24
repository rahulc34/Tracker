import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import {
  badRequest,
  clampProgress,
  notFound,
  param,
  serverError,
} from "../lib/http.js";
import { getYearOverview, getYearProgress } from "../lib/progress.js";
import {
  createMonthBody,
  createSkillBody,
  createYearBody,
} from "../lib/validators.js";

export const yearsRouter = Router();

yearsRouter.get("/:yearId", async (req: Request, res: Response) => {
  try {
    const year = await prisma.year.findUnique({
      where: { id: param(req, "yearId") },
      include: { months: { orderBy: { monthIndex: "asc" } } },
    });
    if (!year) {
      notFound(res, "Year not found");
      return;
    }
    res.json(year);
  } catch (err) {
    serverError(res, err);
  }
});

yearsRouter.patch("/:yearId", async (req: Request, res: Response) => {
  const parsed = createYearBody.partial().safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const year = await prisma.year.update({
      where: { id: param(req, "yearId") },
      data: parsed.data,
    });
    res.json(year);
  } catch {
    notFound(res, "Year not found");
  }
});

yearsRouter.delete("/:yearId", async (req: Request, res: Response) => {
  try {
    await prisma.year.delete({ where: { id: param(req, "yearId") } });
    res.status(204).send();
  } catch {
    notFound(res, "Year not found");
  }
});

yearsRouter.get("/:yearId/overview", async (req: Request, res: Response) => {
  try {
    const overview = await getYearOverview(prisma, param(req, "yearId"));
    if (!overview) {
      notFound(res, "Year not found");
      return;
    }
    res.json(overview);
  } catch (err) {
    serverError(res, err);
  }
});

yearsRouter.get("/:yearId/progress", async (req: Request, res: Response) => {
  try {
    const yearId = param(req, "yearId");
    const year = await prisma.year.findUnique({ where: { id: yearId } });
    if (!year) {
      notFound(res, "Year not found");
      return;
    }
    res.json({ yearId, progress: await getYearProgress(prisma, yearId) });
  } catch (err) {
    serverError(res, err);
  }
});

yearsRouter.get("/:yearId/months", async (req: Request, res: Response) => {
  try {
    const months = await prisma.month.findMany({
      where: { yearId: param(req, "yearId") },
      orderBy: { monthIndex: "asc" },
    });
    res.json(months);
  } catch (err) {
    serverError(res, err);
  }
});

yearsRouter.post("/:yearId/months", async (req: Request, res: Response) => {
  const parsed = createMonthBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const yearId = param(req, "yearId");
    const year = await prisma.year.findUnique({ where: { id: yearId } });
    if (!year) {
      notFound(res, "Year not found");
      return;
    }
    const month = await prisma.month.create({
      data: { yearId, monthIndex: parsed.data.monthIndex },
    });
    res.status(201).json(month);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      badRequest(res, "Month already exists for this year");
      return;
    }
    serverError(res, err);
  }
});

yearsRouter.get("/:yearId/skills", async (req: Request, res: Response) => {
  try {
    const yearId = param(req, "yearId");
    const scope = req.query.scope;
    const pool = req.query.pool ?? "all";

    const skills = await prisma.skill.findMany({
      where: {
        yearId,
        parentSkillId: null,
        ...(scope === "yearly" || scope === "monthly" ? { scope } : {}),
      },
      include: {
        subSkills: true,
        resources: true,
        assignments: { include: { month: true } },
      },
      orderBy: [{ scope: "asc" }, { sortOrder: "asc" }],
    });

    const filtered =
      pool === "available"
        ? skills.filter((s) => s.scope === "monthly" && s.assignments.length === 0)
        : pool === "assigned"
          ? skills.filter((s) => s.assignments.length > 0)
          : skills;

    res.json(filtered);
  } catch (err) {
    serverError(res, err);
  }
});

yearsRouter.post("/:yearId/skills", async (req: Request, res: Response) => {
  const body = createSkillBody.safeParse(req.body);
  if (!body.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const yearId = param(req, "yearId");
    const year = await prisma.year.findUnique({ where: { id: yearId } });
    if (!year) {
      notFound(res, "Year not found");
      return;
    }

    if (body.data.parentSkillId) {
      const parent = await prisma.skill.findFirst({
        where: { id: body.data.parentSkillId, yearId },
      });
      if (!parent) {
        badRequest(res, "Parent skill not found in this year");
        return;
      }
    }

    const skill = await prisma.skill.create({
      data: {
        yearId,
        scope: body.data.scope,
        title: body.data.title,
        description: body.data.description,
        tag: body.data.tag,
        progress: clampProgress(body.data.progress),
        isCompleted: body.data.isCompleted,
        estimatedDays: body.data.estimatedDays,
        startedAt: body.data.startedAt ? new Date(body.data.startedAt) : undefined,
        sortOrder: body.data.sortOrder,
        parentSkillId: body.data.parentSkillId,
      },
      include: { subSkills: true, resources: true },
    });
    res.status(201).json(skill);
  } catch (err) {
    serverError(res, err);
  }
});

/** Nested under /api/users/:userId/years */
export const userYearsRouter = Router({ mergeParams: true });

userYearsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const years = await prisma.year.findMany({
      where: { userId: param(req, "userId") },
      orderBy: { yearNumber: "desc" },
      include: {
        _count: { select: { skills: true, months: true } },
      },
    });
    res.json(years);
  } catch (err) {
    serverError(res, err);
  }
});

userYearsRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createYearBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const userId = param(req, "userId");
    const user = await prisma.trackerUser.findUnique({ where: { id: userId } });
    if (!user) {
      notFound(res, "User not found");
      return;
    }

    const year = await prisma.year.create({
      data: {
        userId,
        yearNumber: parsed.data.yearNumber,
        ...(parsed.data.createMonths
          ? {
              months: {
                create: Array.from({ length: 12 }, (_, i) => ({
                  monthIndex: i + 1,
                })),
              },
            }
          : {}),
      },
      include: { months: { orderBy: { monthIndex: "asc" } } },
    });
    res.status(201).json(year);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      badRequest(res, "Year already exists for this user");
      return;
    }
    serverError(res, err);
  }
});
