import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { createCorsOriginChecker } from "./lib/cors.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { yearsRouter, userYearsRouter } from "./routes/years.js";
import { skillsRouter, resourcesRouter } from "./routes/skills.js";
import { monthsRouter } from "./routes/months.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { bookmarksRouter, userBookmarksRouter } from "./routes/bookmarks.js";
import {
  requireAuth,
  requireAssignmentAccess,
  requireBookmarkAccess,
  requireMatchingUser,
  requireMonthAccess,
  requireResourceAccess,
  requireSkillAccess,
  requireYearAccess,
} from "./middleware/auth.js";

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: createCorsOriginChecker(config.corsOrigins),
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tracker-backend" });
});

app.use("/api/auth", requireAuth, authRouter);

app.use("/api/users/:userId", requireAuth, requireMatchingUser);
app.use("/api/users", requireAuth, usersRouter);
app.use("/api/users/:userId/bookmarks", userBookmarksRouter);
app.use("/api/users/:userId/years", userYearsRouter);

app.use("/api/years/:yearId", requireAuth, requireYearAccess);
app.use("/api/years", yearsRouter);

app.use("/api/skills/:skillId", requireAuth, requireSkillAccess);
app.use("/api/skills", skillsRouter);

app.use("/api/resources/:resourceId", requireAuth, requireResourceAccess);
app.use("/api/resources", resourcesRouter);

app.use("/api/months/:monthId", requireAuth, requireMonthAccess);
app.use("/api/months", monthsRouter);

app.use(
  "/api/assignments/:assignmentId",
  requireAuth,
  requireAssignmentAccess,
);
app.use("/api/assignments", assignmentsRouter);

app.use("/api/bookmarks/:bookmarkId", requireAuth, requireBookmarkAccess);
app.use("/api/bookmarks", bookmarksRouter);

app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `No route ${req.method} ${req.path}` },
  });
});

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Tracker backend listening on 0.0.0.0:${config.PORT}`);
});
