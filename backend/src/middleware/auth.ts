import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { param, unauthorized, forbidden } from "../lib/http.js";
import { verifyAccessToken } from "../lib/supabase.js";
import {
  assignmentBelongsToUser,
  bookmarkBelongsToUser,
  monthBelongsToUser,
  resourceBelongsToUser,
  skillBelongsToUser,
  yearBelongsToUser,
} from "../lib/ownership.js";

export type AuthedRequest = Request & { authUserId: string };

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (config.AUTH_DISABLED) {
    (req as AuthedRequest).authUserId = config.DEFAULT_USER_ID;
    next();
    return;
  }

  const token = bearerToken(req);
  if (!token) {
    unauthorized(res);
    return;
  }

  const user = await verifyAccessToken(token);
  if (!user) {
    unauthorized(res);
    return;
  }

  (req as AuthedRequest).authUserId = user.id;
  next();
}

export function requireMatchingUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authed = req as AuthedRequest;
  const userId = param(req, "userId");
  if (userId !== authed.authUserId) {
    forbidden(res);
    return;
  }
  next();
}

async function guard(
  req: Request,
  res: Response,
  next: NextFunction,
  check: (id: string, userId: string) => Promise<boolean>,
  paramName: string,
): Promise<void> {
  const authed = req as AuthedRequest;
  const id = param(req, paramName);
  if (!(await check(id, authed.authUserId))) {
    forbidden(res);
    return;
  }
  next();
}

export const requireYearAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => guard(req, res, next, yearBelongsToUser, "yearId");

export const requireSkillAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => guard(req, res, next, skillBelongsToUser, "skillId");

export const requireMonthAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => guard(req, res, next, monthBelongsToUser, "monthId");

export const requireAssignmentAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => guard(req, res, next, assignmentBelongsToUser, "assignmentId");

export const requireBookmarkAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => guard(req, res, next, bookmarkBelongsToUser, "bookmarkId");

export const requireResourceAccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => guard(req, res, next, resourceBelongsToUser, "resourceId");
