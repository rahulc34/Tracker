import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import {
  badRequest,
  notFound,
  param,
  parseDateOnly,
  serverError,
} from "../lib/http.js";
import { getMonthOverview, getMonthProgress } from "../lib/progress.js";
import { assignSkillBody } from "../lib/validators.js";

export const monthsRouter = Router();

monthsRouter.get("/:monthId", async (req: Request, res: Response) => {
  try {
    const month = await prisma.month.findUnique({
      where: { id: param(req, "monthId") },
      include: { year: true },
    });
    if (!month) {
      notFound(res, "Month not found");
      return;
    }
    res.json(month);
  } catch (err) {
    serverError(res, err);
  }
});

monthsRouter.patch("/:monthId", async (req: Request, res: Response) => {
  try {
    const month = await prisma.month.update({
      where: { id: param(req, "monthId") },
      data: {
        ...(typeof req.body.isActive === "boolean"
          ? { isActive: req.body.isActive }
          : {}),
      },
    });
    res.json(month);
  } catch {
    notFound(res, "Month not found");
  }
});

monthsRouter.delete("/:monthId", async (req: Request, res: Response) => {
  try {
    await prisma.month.delete({ where: { id: param(req, "monthId") } });
    res.status(204).send();
  } catch {
    notFound(res, "Month not found");
  }
});

monthsRouter.get("/:monthId/overview", async (req: Request, res: Response) => {
  try {
    const overview = await getMonthOverview(prisma, param(req, "monthId"));
    if (!overview) {
      notFound(res, "Month not found");
      return;
    }
    res.json(overview);
  } catch (err) {
    serverError(res, err);
  }
});

monthsRouter.get("/:monthId/progress", async (req: Request, res: Response) => {
  try {
    const monthId = param(req, "monthId");
    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) {
      notFound(res, "Month not found");
      return;
    }
    res.json({ monthId, progress: await getMonthProgress(prisma, monthId) });
  } catch (err) {
    serverError(res, err);
  }
});

monthsRouter.get("/:monthId/assignments", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.monthAssignment.findMany({
      where: { monthId: param(req, "monthId") },
      include: {
        skill: { include: { subSkills: true, resources: true } },
        events: { orderBy: { sequence: "asc" } },
        datePins: { orderBy: { pinnedDate: "asc" } },
      },
    });
    res.json(assignments);
  } catch (err) {
    serverError(res, err);
  }
});

monthsRouter.post("/:monthId/assignments", async (req: Request, res: Response) => {
  const parsed = assignSkillBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const monthId = param(req, "monthId");
    const month = await prisma.month.findUnique({ where: { id: monthId } });
    if (!month) {
      notFound(res, "Month not found");
      return;
    }

    const skill = await prisma.skill.findFirst({
      where: {
        id: parsed.data.skillId,
        yearId: month.yearId,
        scope: "monthly",
        parentSkillId: null,
      },
    });
    if (!skill) {
      badRequest(res, "Monthly skill not found in this year");
      return;
    }

    const targetDate = parseDateOnly(parsed.data.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      badRequest(res, "Cannot assign to a past date");
      return;
    }

    const existing = await prisma.monthAssignment.findUnique({
      where: { skillId_monthId: { skillId: skill.id, monthId } },
    });
    if (existing) {
      badRequest(res, "Skill already assigned to this month");
      return;
    }

    const assignment = await prisma.monthAssignment.create({
      data: {
        skillId: skill.id,
        monthId,
        currentTargetDate: targetDate,
        events: {
          create: {
            eventDate: targetDate,
            eventType: "created",
            status: "started",
            sequence: 1,
            note: parsed.data.note,
          },
        },
        datePins: {
          create: {
            pinnedDate: targetDate,
            isReassignment: false,
          },
        },
      },
      include: {
        skill: true,
        events: { orderBy: { sequence: "asc" } },
        datePins: { orderBy: { pinnedDate: "asc" } },
      },
    });

    res.status(201).json(assignment);
  } catch (err) {
    serverError(res, err);
  }
});
