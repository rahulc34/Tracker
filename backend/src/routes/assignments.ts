import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import {
  badRequest,
  notFound,
  param,
  parseDateOnly,
  serverError,
} from "../lib/http.js";
import {
  createDatePinBody,
  createEventBody,
  reassignBody,
  updateAssignmentBody,
} from "../lib/validators.js";

export const assignmentsRouter = Router();

assignmentsRouter.get("/:assignmentId", async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.monthAssignment.findUnique({
      where: { id: param(req, "assignmentId") },
      include: {
        skill: { include: { subSkills: true, resources: true } },
        month: { include: { year: true } },
        events: { orderBy: { sequence: "asc" } },
        datePins: { orderBy: { pinnedDate: "asc" } },
      },
    });
    if (!assignment) {
      notFound(res, "Assignment not found");
      return;
    }
    res.json(assignment);
  } catch (err) {
    serverError(res, err);
  }
});

assignmentsRouter.patch("/:assignmentId", async (req: Request, res: Response) => {
  const parsed = updateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const assignment = await prisma.monthAssignment.update({
      where: { id: param(req, "assignmentId") },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.currentTargetDate !== undefined
          ? { currentTargetDate: parseDateOnly(parsed.data.currentTargetDate) }
          : {}),
      },
      include: {
        events: { orderBy: { sequence: "asc" } },
        datePins: { orderBy: { pinnedDate: "asc" } },
      },
    });
    res.json(assignment);
  } catch {
    notFound(res, "Assignment not found");
  }
});

assignmentsRouter.delete("/:assignmentId", async (req: Request, res: Response) => {
  try {
    await prisma.monthAssignment.delete({
      where: { id: param(req, "assignmentId") },
    });
    res.status(204).send();
  } catch {
    notFound(res, "Assignment not found");
  }
});

assignmentsRouter.get("/:assignmentId/events", async (req: Request, res: Response) => {
  try {
    const events = await prisma.assignmentEvent.findMany({
      where: { assignmentId: param(req, "assignmentId") },
      orderBy: { sequence: "asc" },
    });
    res.json(events);
  } catch (err) {
    serverError(res, err);
  }
});

assignmentsRouter.post("/:assignmentId/events", async (req: Request, res: Response) => {
  const parsed = createEventBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const assignmentId = param(req, "assignmentId");
    const assignment = await prisma.monthAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      notFound(res, "Assignment not found");
      return;
    }

    const last = await prisma.assignmentEvent.findFirst({
      where: { assignmentId },
      orderBy: { sequence: "desc" },
    });
    const sequence = (last?.sequence ?? 0) + 1;

    const event = await prisma.assignmentEvent.create({
      data: {
        assignmentId,
        eventDate: parseDateOnly(parsed.data.eventDate),
        eventType: parsed.data.eventType,
        status: parsed.data.status,
        note: parsed.data.note,
        sequence,
      },
    });
    res.status(201).json(event);
  } catch (err) {
    serverError(res, err);
  }
});

assignmentsRouter.get("/:assignmentId/date-pins", async (req: Request, res: Response) => {
  try {
    const pins = await prisma.datePin.findMany({
      where: { assignmentId: param(req, "assignmentId") },
      orderBy: { pinnedDate: "asc" },
    });
    res.json(pins);
  } catch (err) {
    serverError(res, err);
  }
});

assignmentsRouter.post("/:assignmentId/date-pins", async (req: Request, res: Response) => {
  const parsed = createDatePinBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const pin = await prisma.datePin.create({
      data: {
        assignmentId: param(req, "assignmentId"),
        pinnedDate: parseDateOnly(parsed.data.pinnedDate),
        isReassignment: parsed.data.isReassignment,
      },
    });
    res.status(201).json(pin);
  } catch (err) {
    serverError(res, err);
  }
});

/** Roll unfinished skill forward to a new date (and optionally a new month). */
assignmentsRouter.post("/:assignmentId/reassign", async (req: Request, res: Response) => {
  const parsed = reassignBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const assignmentId = param(req, "assignmentId");
    const current = await prisma.monthAssignment.findUnique({
      where: { id: assignmentId },
      include: { month: true, events: true },
    });
    if (!current) {
      notFound(res, "Assignment not found");
      return;
    }

    const targetDate = parseDateOnly(parsed.data.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      badRequest(res, "Cannot assign to a past date");
      return;
    }
    const nextSequence =
      current.events.reduce((max, e) => Math.max(max, e.sequence), 0) + 1;

    if (parsed.data.newMonthId && parsed.data.newMonthId !== current.monthId) {
      const newMonth = await prisma.month.findFirst({
        where: { id: parsed.data.newMonthId, yearId: current.month.yearId },
      });
      if (!newMonth) {
        badRequest(res, "Target month not found in same year");
        return;
      }

      await prisma.monthAssignment.update({
        where: { id: assignmentId },
        data: { status: "overdue" },
      });

      const existing = await prisma.monthAssignment.findUnique({
        where: {
          skillId_monthId: { skillId: current.skillId, monthId: newMonth.id },
        },
      });
      if (existing) {
        badRequest(res, "Skill already assigned to target month");
        return;
      }

      const newAssignment = await prisma.monthAssignment.create({
        data: {
          skillId: current.skillId,
          monthId: newMonth.id,
          currentTargetDate: targetDate,
          status: "in_progress",
          events: {
            create: {
              eventDate: targetDate,
              eventType: "reassigned",
              status: "in_progress",
              sequence: 1,
              note: parsed.data.note,
            },
          },
          datePins: {
            create: { pinnedDate: targetDate, isReassignment: true },
          },
        },
        include: {
          events: { orderBy: { sequence: "asc" } },
          datePins: { orderBy: { pinnedDate: "asc" } },
          month: true,
          skill: true,
        },
      });

      res.json({ previousAssignmentId: assignmentId, assignment: newAssignment });
      return;
    }

    const updated = await prisma.monthAssignment.update({
      where: { id: assignmentId },
      data: {
        currentTargetDate: targetDate,
        status: "in_progress",
        events: {
          create: {
            eventDate: targetDate,
            eventType: "reassigned",
            status: "incomplete",
            sequence: nextSequence,
            note: parsed.data.note,
          },
        },
        datePins: {
          create: { pinnedDate: targetDate, isReassignment: true },
        },
      },
      include: {
        events: { orderBy: { sequence: "asc" } },
        datePins: { orderBy: { pinnedDate: "asc" } },
        month: true,
        skill: true,
      },
    });

    res.json({ previousAssignmentId: assignmentId, assignment: updated });
  } catch (err) {
    serverError(res, err);
  }
});

assignmentsRouter.post("/:assignmentId/complete", async (req: Request, res: Response) => {
  try {
    const assignmentId = param(req, "assignmentId");
    const assignment = await prisma.monthAssignment.findUnique({
      where: { id: assignmentId },
      include: { skill: true, events: true },
    });
    if (!assignment) {
      notFound(res, "Assignment not found");
      return;
    }

    const today = new Date();
    const nextSequence =
      assignment.events.reduce((max, e) => Math.max(max, e.sequence), 0) + 1;

    const [updatedAssignment] = await prisma.$transaction([
      prisma.monthAssignment.update({
        where: { id: assignmentId },
        data: { status: "completed" },
        include: {
          events: { orderBy: { sequence: "asc" } },
          datePins: { orderBy: { pinnedDate: "asc" } },
        },
      }),
      prisma.skill.update({
        where: { id: assignment.skillId },
        data: { isCompleted: true, progress: 100 },
      }),
      prisma.assignmentEvent.create({
        data: {
          assignmentId,
          eventDate: today,
          eventType: "completed",
          status: "completed",
          sequence: nextSequence,
        },
      }),
    ]);

    res.json(updatedAssignment);
  } catch (err) {
    serverError(res, err);
  }
});
