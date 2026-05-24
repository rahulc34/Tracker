import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { badRequest, notFound, param, serverError } from "../lib/http.js";
import { buildResourceTree } from "../lib/progress.js";
import {
  bookmarkCategory,
  createVaultBookmarkBody,
  profilePlatform,
  updateBookmarkBody,
  upsertProfileBookmarkBody,
} from "../lib/validators.js";

export const userBookmarksRouter = Router({ mergeParams: true });

userBookmarksRouter.get("/", async (req: Request, res: Response) => {
  const parsed = bookmarkCategory.safeParse(req.query.category);
  if (!parsed.success) {
    badRequest(res, "category must be vault or profile");
    return;
  }

  try {
    const userId = param(req, "userId");
    const user = await prisma.trackerUser.findUnique({ where: { id: userId } });
    if (!user) {
      notFound(res, "User not found");
      return;
    }

    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId, category: parsed.data },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (parsed.data === "vault") {
      res.json({
        items: bookmarks,
        tree: buildResourceTree(
          bookmarks.map((b) => ({
            ...b,
            parentId: b.parentId,
          })),
        ),
      });
      return;
    }

    res.json(bookmarks);
  } catch (err) {
    serverError(res, err);
  }
});

userBookmarksRouter.post("/vault", async (req: Request, res: Response) => {
  const parsed = createVaultBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const userId = param(req, "userId");
    const user = await prisma.trackerUser.findUnique({ where: { id: userId } });
    if (!user) {
      notFound(res, "User not found");
      return;
    }

    if (parsed.data.parentId) {
      const parent = await prisma.userBookmark.findFirst({
        where: {
          id: parsed.data.parentId,
          userId,
          category: "vault",
          kind: "folder",
        },
      });
      if (!parent) {
        badRequest(res, "Parent folder not found");
        return;
      }
    }

    const bookmark = await prisma.userBookmark.create({
      data: {
        userId,
        category: "vault",
        kind: parsed.data.kind,
        parentId: parsed.data.parentId ?? null,
        platform:
          parsed.data.kind === "folder" ? "folder" : parsed.data.platform,
        title: parsed.data.title,
        url: parsed.data.kind === "folder" ? null : parsed.data.url!,
        note: parsed.data.note,
        sortOrder: parsed.data.sortOrder,
      },
    });
    res.status(201).json(bookmark);
  } catch (err) {
    serverError(res, err);
  }
});

userBookmarksRouter.put(
  "/profile/:platform",
  async (req: Request, res: Response) => {
    const platformParsed = profilePlatform.safeParse(param(req, "platform"));
    if (!platformParsed.success) {
      badRequest(res, "Invalid profile platform");
      return;
    }

    const parsed = upsertProfileBookmarkBody.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, "Invalid body");
      return;
    }

    try {
      const userId = param(req, "userId");
      const user = await prisma.trackerUser.findUnique({ where: { id: userId } });
      if (!user) {
        notFound(res, "User not found");
        return;
      }

      const existing = await prisma.userBookmark.findFirst({
        where: {
          userId,
          category: "profile",
          platform: platformParsed.data,
        },
      });

      const bookmark = existing
        ? await prisma.userBookmark.update({
            where: { id: existing.id },
            data: {
              title: parsed.data.title,
              url: parsed.data.url,
              note: parsed.data.note,
            },
          })
        : await prisma.userBookmark.create({
            data: {
              userId,
              category: "profile",
              kind: "link",
              platform: platformParsed.data,
              title: parsed.data.title,
              url: parsed.data.url,
              note: parsed.data.note,
              sortOrder: profileSortOrder(platformParsed.data),
            },
          });
      res.json(bookmark);
    } catch (err) {
      serverError(res, err);
    }
  },
);

export const bookmarksRouter = Router();

bookmarksRouter.patch("/:bookmarkId", async (req: Request, res: Response) => {
  const parsed = updateBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    badRequest(res, "Invalid body");
    return;
  }

  try {
    const bookmarkId = param(req, "bookmarkId");
    const bookmark = await prisma.userBookmark.findUnique({
      where: { id: bookmarkId },
    });
    if (!bookmark) {
      notFound(res, "Bookmark not found");
      return;
    }

    if (parsed.data.parentId !== undefined && parsed.data.parentId !== null) {
      if (parsed.data.parentId === bookmarkId) {
        badRequest(res, "Cannot nest item inside itself");
        return;
      }
      const parent = await prisma.userBookmark.findFirst({
        where: {
          id: parsed.data.parentId,
          userId: bookmark.userId,
          category: "vault",
          kind: "folder",
        },
      });
      if (!parent) {
        badRequest(res, "Parent folder not found");
        return;
      }
    }

    const updated = await prisma.userBookmark.update({
      where: { id: bookmark.id },
      data: parsed.data,
    });
    res.json(updated);
  } catch (err) {
    serverError(res, err);
  }
});

bookmarksRouter.delete("/:bookmarkId", async (req: Request, res: Response) => {
  try {
    await prisma.userBookmark.delete({
      where: { id: param(req, "bookmarkId") },
    });
    res.status(204).send();
  } catch {
    notFound(res, "Bookmark not found");
  }
});

function profileSortOrder(platform: string): number {
  const order = ["leetcode", "gfg", "codeforces", "codechef", "linkedin"];
  const idx = order.indexOf(platform);
  return idx === -1 ? 99 : idx + 1;
}
