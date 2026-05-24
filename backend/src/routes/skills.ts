import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import {
  badRequest,
  clampProgress,
  notFound,
  param,
  serverError,
} from "../lib/http.js";
import { buildResourceTree, syncAssignmentOnSkillComplete, syncParentFromSubSkills } from "../lib/progress.js";
import { createSkillBody, updateSkillBody } from "../lib/validators.js";

export const skillsRouter = Router();

skillsRouter.get("/:skillId", async (req: Request, res: Response) => {
  try {
    const skill = await prisma.skill.findUnique({
      where: { id: param(req, "skillId") },
      include: {
        subSkills: { orderBy: { sortOrder: "asc" } },
        resources: { orderBy: { sortOrder: "asc" } },
        assignments: {
          include: {
            month: true,
            events: { orderBy: { sequence: "asc" } },
            datePins: { orderBy: { pinnedDate: "asc" } },
          },
        },
        parent: true,
        year: true,
      },
    });
    if (!skill) {
      notFound(res, "Skill not found");
      return;
    }
    res.json({
      ...skill,
      resourceTree: buildResourceTree(skill.resources),
    });
  } catch (err) {
    serverError(res, err);
  }
});

skillsRouter.patch("/:skillId", async (req: Request, res: Response) => {
  const parsed = updateSkillBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const skillId = param(req, "skillId");
    const existing = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!existing) {
      notFound(res, "Skill not found");
      return;
    }

    const data = parsed.data;
    await prisma.skill.update({
      where: { id: skillId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.tag !== undefined ? { tag: data.tag } : {}),
        ...(data.scope !== undefined ? { scope: data.scope } : {}),
        ...(data.progress !== undefined
          ? { progress: clampProgress(data.progress) }
          : {}),
        ...(data.isCompleted !== undefined ? { isCompleted: data.isCompleted } : {}),
        ...(data.estimatedDays !== undefined ? { estimatedDays: data.estimatedDays } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.startedAt !== undefined
          ? { startedAt: data.startedAt ? new Date(data.startedAt) : null }
          : {}),
      },
    });

    if (data.isCompleted === true) {
      const current = await prisma.skill.findUnique({ where: { id: skillId } });
      if (current && current.progress < 100) {
        await prisma.skill.update({
          where: { id: skillId },
          data: { progress: 100 },
        });
      }
      await syncAssignmentOnSkillComplete(prisma, skillId);
    }

    if (existing.parentSkillId) {
      await syncParentFromSubSkills(prisma, existing.parentSkillId);
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        subSkills: { orderBy: { sortOrder: "asc" } },
        resources: { orderBy: { sortOrder: "asc" } },
        assignments: {
          include: {
            month: true,
            events: { orderBy: { sequence: "asc" } },
            datePins: { orderBy: { pinnedDate: "asc" } },
          },
        },
        parent: true,
        year: true,
      },
    });

    res.json({
      ...skill,
      resourceTree: skill ? buildResourceTree(skill.resources) : [],
    });
  } catch {
    notFound(res, "Skill not found");
  }
});

skillsRouter.delete("/:skillId", async (req: Request, res: Response) => {
  try {
    const skillId = param(req, "skillId");
    const existing = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!existing) {
      notFound(res, "Skill not found");
      return;
    }
    const parentSkillId = existing.parentSkillId;
    await prisma.skill.delete({ where: { id: skillId } });
    if (parentSkillId) {
      await syncParentFromSubSkills(prisma, parentSkillId);
    }
    res.status(204).send();
  } catch {
    notFound(res, "Skill not found");
  }
});

skillsRouter.get("/:skillId/sub-skills", async (req: Request, res: Response) => {
  try {
    const subSkills = await prisma.skill.findMany({
      where: { parentSkillId: param(req, "skillId") },
      orderBy: { sortOrder: "asc" },
    });
    res.json(subSkills);
  } catch (err) {
    serverError(res, err);
  }
});

skillsRouter.post("/:skillId/sub-skills", async (req: Request, res: Response) => {
  const parsed = createSkillBody
    .omit({ scope: true })
    .extend({ scope: createSkillBody.shape.scope.optional() })
    .safeParse(req.body);

  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const parentSkillId = param(req, "skillId");
    const parent = await prisma.skill.findUnique({ where: { id: parentSkillId } });
    if (!parent) {
      notFound(res, "Skill not found");
      return;
    }

    const subSkill = await prisma.skill.create({
      data: {
        yearId: parent.yearId,
        parentSkillId,
        scope: parent.scope,
        title: parsed.data.title,
        description: parsed.data.description,
        tag: parsed.data.tag,
        progress: clampProgress(parsed.data.progress),
        isCompleted: parsed.data.isCompleted,
        sortOrder: parsed.data.sortOrder,
      },
    });
    await syncParentFromSubSkills(prisma, parentSkillId);
    res.status(201).json(subSkill);
  } catch (err) {
    serverError(res, err);
  }
});

skillsRouter.get("/:skillId/resources", async (req: Request, res: Response) => {
  try {
    const resources = await prisma.skillResource.findMany({
      where: { skillId: param(req, "skillId") },
      orderBy: { sortOrder: "asc" },
    });
    res.json({
      flat: resources,
      tree: buildResourceTree(resources),
    });
  } catch (err) {
    serverError(res, err);
  }
});

skillsRouter.post("/:skillId/resources", async (req: Request, res: Response) => {
  const { createResourceBody } = await import("../lib/validators.js");
  const parsed = createResourceBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const skillId = param(req, "skillId");
    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) {
      notFound(res, "Skill not found");
      return;
    }

    if (parsed.data.parentId) {
      const folder = await prisma.skillResource.findFirst({
        where: { id: parsed.data.parentId, skillId, type: "folder" },
      });
      if (!folder) {
        badRequest(res, "Parent folder not found");
        return;
      }
    }

    const resource = await prisma.skillResource.create({
      data: {
        skillId,
        type: parsed.data.type,
        title: parsed.data.title,
        url: parsed.data.url,
        content: parsed.data.content,
        parentId: parsed.data.parentId,
        sortOrder: parsed.data.sortOrder,
      },
    });
    res.status(201).json(resource);
  } catch (err) {
    serverError(res, err);
  }
});

skillsRouter.get("/:skillId/assignments", async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.monthAssignment.findMany({
      where: { skillId: param(req, "skillId") },
      include: {
        month: true,
        events: { orderBy: { sequence: "asc" } },
        datePins: { orderBy: { pinnedDate: "asc" } },
      },
    });
    res.json(assignments);
  } catch (err) {
    serverError(res, err);
  }
});

export const resourcesRouter = Router();

resourcesRouter.patch("/:resourceId", async (req: Request, res: Response) => {
  const { updateResourceBody } = await import("../lib/validators.js");
  const parsed = updateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const resource = await prisma.skillResource.update({
      where: { id: param(req, "resourceId") },
      data: parsed.data,
    });
    res.json(resource);
  } catch {
    notFound(res, "Resource not found");
  }
});

resourcesRouter.delete("/:resourceId", async (req: Request, res: Response) => {
  try {
    await prisma.skillResource.delete({ where: { id: param(req, "resourceId") } });
    res.status(204).send();
  } catch {
    notFound(res, "Resource not found");
  }
});
