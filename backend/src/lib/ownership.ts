import { prisma } from "../db.js";

export async function yearBelongsToUser(
  yearId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.year.findFirst({
    where: { id: yearId, userId },
    select: { id: true },
  });
  return !!row;
}

export async function skillBelongsToUser(
  skillId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.skill.findFirst({
    where: { id: skillId, year: { userId } },
    select: { id: true },
  });
  return !!row;
}

export async function monthBelongsToUser(
  monthId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.month.findFirst({
    where: { id: monthId, year: { userId } },
    select: { id: true },
  });
  return !!row;
}

export async function assignmentBelongsToUser(
  assignmentId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.monthAssignment.findFirst({
    where: { id: assignmentId, skill: { year: { userId } } },
    select: { id: true },
  });
  return !!row;
}

export async function bookmarkBelongsToUser(
  bookmarkId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.userBookmark.findFirst({
    where: { id: bookmarkId, userId },
    select: { id: true },
  });
  return !!row;
}

export async function resourceBelongsToUser(
  resourceId: string,
  userId: string,
): Promise<boolean> {
  const row = await prisma.skillResource.findFirst({
    where: { id: resourceId, skill: { year: { userId } } },
    select: { id: true },
  });
  return !!row;
}
