import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { serverError } from "../lib/http.js";
import type { AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/session", async (req: Request, res: Response) => {
  const { authUserId } = req as AuthedRequest;
  const email =
    typeof req.body?.email === "string" ? req.body.email : undefined;
  const name =
    typeof req.body?.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : email?.split("@")[0] ?? "User";

  try {
    const user = await prisma.trackerUser.upsert({
      where: { id: authUserId },
      create: {
        id: authUserId,
        supabaseAuthId: authUserId,
        email: email ?? null,
        name,
      },
      update: {
        supabaseAuthId: authUserId,
        ...(email ? { email } : {}),
        name,
      },
    });
    res.json(user);
  } catch (err) {
    serverError(res, err);
  }
});
