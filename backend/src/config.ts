import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4001),
  CORS_ORIGINS: z.string().default("*"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsOrigins:
    parsed.data.CORS_ORIGINS === "*"
      ? "*"
      : parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()),
};
