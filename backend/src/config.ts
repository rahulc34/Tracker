import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Prisma CLI reads .env directly; at runtime default DIRECT_URL for local single-URL setups.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4001),
  CORS_ORIGINS: z.string().default("*"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AUTH_DISABLED: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
  DEFAULT_USER_ID: z
    .string()
    .uuid()
    .default("00000000-0000-4000-8000-000000000001"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

export const config = {
  ...data,
  AUTH_DISABLED: data.AUTH_DISABLED ?? false,
  corsOrigins:
    data.CORS_ORIGINS === "*"
      ? "*"
      : data.CORS_ORIGINS.split(",").map((s) => s.trim()),
};
