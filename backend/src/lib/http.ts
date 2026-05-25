import type { Request, Response } from "express";
import type { Request as ExpressRequest } from "express";

export function param(req: ExpressRequest, name: string): string {
  const v = req.params[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  throw new Error(`Missing param: ${name}`);
}

export function badRequest(res: Response, message: string) {
  res.status(400).json({ error: { code: "BAD_REQUEST", message } });
}

export function notFound(res: Response, message = "Not found") {
  res.status(404).json({ error: { code: "NOT_FOUND", message } });
}

export function unauthorized(res: Response, message = "Unauthorized") {
  res.status(401).json({ error: { code: "UNAUTHORIZED", message } });
}

export function forbidden(res: Response, message = "Forbidden") {
  res.status(403).json({ error: { code: "FORBIDDEN", message } });
}

export function serverError(res: Response, err: unknown) {
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
}

export function parseDateOnly(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return d;
}

export function clampProgress(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Coerce Express query param to optional string. */
export function queryString(req: Request, key: string): string | undefined {
  const v = req.query[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}
