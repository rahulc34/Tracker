import type { SubSkill } from "./types";

export function deriveFromSubSkills(subSkills: SubSkill[]) {
  if (subSkills.length === 0) return null;
  const progress = Math.round(
    subSkills.reduce((sum, s) => sum + s.progress, 0) / subSkills.length,
  );
  const isCompleted = subSkills.every((s) => s.isCompleted);
  return { progress, isCompleted };
}
