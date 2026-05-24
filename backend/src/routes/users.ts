import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { badRequest, notFound, param, serverError } from "../lib/http.js";
import { createUserBody } from "../lib/validators.js";
import { getRootOverview } from "../lib/progress.js";

export const usersRouter = Router();

usersRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createUserBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }
  try {
    const user = await prisma.trackerUser.create({ data: parsed.data });
    res.status(201).json(user);
  } catch (err) {
    serverError(res, err);
  }
});

usersRouter.get("/:userId", async (req: Request, res: Response) => {
  try {
    const user = await prisma.trackerUser.findUnique({
      where: { id: param(req, "userId") },
    });
    if (!user) {
      notFound(res, "User not found");
      return;
    }
    res.json(user);
  } catch (err) {
    serverError(res, err);
  }
});

usersRouter.get("/:userId/root-overview", async (req: Request, res: Response) => {
  try {
    const userId = param(req, "userId");
    const user = await prisma.trackerUser.findUnique({ where: { id: userId } });
    if (!user) {
      notFound(res, "User not found");
      return;
    }
    const overview = await getRootOverview(prisma, userId);
    res.json(overview);
  } catch (err) {
    serverError(res, err);
  }
});
