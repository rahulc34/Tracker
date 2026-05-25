import { getApiBase } from "./constants";
import type {
  MonthOverview,
  MonthRecord,
  RootOverview,
  SkillDetail,
  SkillSummary,
  UserBookmark,
  VaultBookmarksResponse,
  YearOverview,
  YearRecord,
} from "./types";

export type PlanSearchHit = {
  id: string;
  title: string;
  href: string;
  kind: "yearly plan" | "monthly plan" | "sub-skill";
  yearNumber: number;
  parentTitle?: string;
};

function normalizeUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

export function createApi(
  userId: string,
  getAccessToken: () => Promise<string | null>,
) {
  async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${getApiBase()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    userId,

    getRootOverview: () =>
      fetchJson<RootOverview>(`/api/users/${userId}/root-overview`),

    getYears: () => fetchJson<YearRecord[]>(`/api/users/${userId}/years`),

    createYear: (yearNumber: number) =>
      fetchJson<YearRecord>(`/api/users/${userId}/years`, {
        method: "POST",
        body: JSON.stringify({ yearNumber, createMonths: true }),
      }),

    getYearOverview: (yearId: string) =>
      fetchJson<YearOverview>(`/api/years/${yearId}/overview`),

    getYearMonths: (yearId: string) =>
      fetchJson<MonthRecord[]>(`/api/years/${yearId}/months`),

    getYearSkills: (yearId: string) =>
      fetchJson<SkillSummary[]>(`/api/years/${yearId}/skills`),

    getPlanSearchIndex: async (): Promise<PlanSearchHit[]> => {
      const years = await fetchJson<YearRecord[]>(`/api/users/${userId}/years`);
      const hits = await Promise.all(
        years.map(async (year) => {
          const skills = await fetchJson<SkillSummary[]>(
            `/api/years/${year.id}/skills`,
          );
          const yearHits: PlanSearchHit[] = [];
          for (const skill of skills) {
            yearHits.push({
              id: skill.id,
              title: skill.title,
              href: `/skill/${skill.id}`,
              kind: skill.scope === "yearly" ? "yearly plan" : "monthly plan",
              yearNumber: year.yearNumber,
            });
            for (const sub of skill.subSkills ?? []) {
              yearHits.push({
                id: sub.id,
                title: sub.title,
                href: `/skill/${skill.id}`,
                kind: "sub-skill",
                yearNumber: year.yearNumber,
                parentTitle: skill.title,
              });
            }
          }
          return yearHits;
        }),
      );
      return hits.flat();
    },

    getMonthOverview: (monthId: string) =>
      fetchJson<MonthOverview>(`/api/months/${monthId}/overview`),

    getSkill: (skillId: string) =>
      fetchJson<SkillDetail>(`/api/skills/${skillId}`),

    updateSkill: (
      skillId: string,
      data: Partial<{
        title: string;
        progress: number;
        isCompleted: boolean;
        description: string;
      }>,
    ) =>
      fetchJson<SkillDetail>(`/api/skills/${skillId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    createSkill: (
      yearId: string,
      data: {
        scope: "yearly" | "monthly";
        title: string;
        description?: string;
        progress?: number;
        estimatedDays?: number;
      },
    ) =>
      fetchJson<SkillSummary>(`/api/years/${yearId}/skills`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    createSubSkill: (
      skillId: string,
      data: { title: string; progress?: number },
    ) =>
      fetchJson<SkillSummary>(`/api/skills/${skillId}/sub-skills`, {
        method: "POST",
        body: JSON.stringify({ title: data.title, progress: data.progress ?? 0 }),
      }),

    createResource: (
      skillId: string,
      data: {
        type: "link" | "file" | "note" | "folder";
        title: string;
        url?: string;
        content?: string;
      },
    ) =>
      fetchJson(`/api/skills/${skillId}/resources`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          ...(data.url ? { url: normalizeUrl(data.url) } : {}),
        }),
      }),

    createPlanFull: async (
      yearId: string,
      data: {
        scope: "yearly" | "monthly";
        title: string;
        description?: string;
        estimatedDays?: number;
        links: { title: string; url: string }[];
        files: { title: string; url: string }[];
        subSkills: { title: string }[];
      },
    ) => {
      const skill = await fetchJson<SkillSummary>(`/api/years/${yearId}/skills`, {
        method: "POST",
        body: JSON.stringify({
          scope: data.scope,
          title: data.title,
          description: data.description,
          estimatedDays: data.estimatedDays,
        }),
      });

      await Promise.all([
        ...data.subSkills
          .filter((s) => s.title.trim())
          .map((s) =>
            fetchJson<SkillSummary>(`/api/skills/${skill.id}/sub-skills`, {
              method: "POST",
              body: JSON.stringify({ title: s.title.trim(), progress: 0 }),
            }),
          ),
        ...data.links
          .filter((l) => l.title.trim() && l.url.trim())
          .map((l) =>
            fetchJson(`/api/skills/${skill.id}/resources`, {
              method: "POST",
              body: JSON.stringify({
                type: "link",
                title: l.title.trim(),
                url: normalizeUrl(l.url),
              }),
            }),
          ),
        ...data.files
          .filter((f) => f.title.trim())
          .map((f) =>
            fetchJson(`/api/skills/${skill.id}/resources`, {
              method: "POST",
              body: JSON.stringify({
                type: "file",
                title: f.title.trim(),
                url: f.url.trim() || undefined,
              }),
            }),
          ),
      ]);

      return skill;
    },

    assignSkillToMonth: (
      monthId: string,
      skillId: string,
      targetDate: string,
    ) =>
      fetchJson(`/api/months/${monthId}/assignments`, {
        method: "POST",
        body: JSON.stringify({ skillId, targetDate }),
      }),

    deleteSkill: (skillId: string) =>
      fetchJson<void>(`/api/skills/${skillId}`, { method: "DELETE" }),

    deleteResource: (resourceId: string) =>
      fetchJson<void>(`/api/resources/${resourceId}`, { method: "DELETE" }),

    reassign: (assignmentId: string, targetDate: string, note?: string) =>
      fetchJson(`/api/assignments/${assignmentId}/reassign`, {
        method: "POST",
        body: JSON.stringify({ targetDate, note }),
      }),

    getVaultBookmarks: () =>
      fetchJson<VaultBookmarksResponse>(
        `/api/users/${userId}/bookmarks?category=vault`,
      ),

    getProfileBookmarks: () =>
      fetchJson<UserBookmark[]>(
        `/api/users/${userId}/bookmarks?category=profile`,
      ),

    createVaultBookmark: (data: {
      kind: "folder" | "link";
      parentId?: string;
      platform?: string;
      title: string;
      url?: string;
      note?: string;
    }) =>
      fetchJson<UserBookmark>(`/api/users/${userId}/bookmarks/vault`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          ...(data.url ? { url: normalizeUrl(data.url) } : {}),
        }),
      }),

    upsertProfileBookmark: (
      platform: string,
      data: { title: string; url: string; note?: string },
    ) =>
      fetchJson<UserBookmark>(
        `/api/users/${userId}/bookmarks/profile/${platform}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...data,
            url: normalizeUrl(data.url),
          }),
        },
      ),

    updateBookmark: (
      bookmarkId: string,
      data: Partial<{
        platform: string;
        title: string;
        url: string;
        note: string | null;
      }>,
    ) =>
      fetchJson<UserBookmark>(`/api/bookmarks/${bookmarkId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...data,
          ...(data.url ? { url: normalizeUrl(data.url) } : {}),
        }),
      }),

    deleteBookmark: (bookmarkId: string) =>
      fetchJson<void>(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" }),
  };
}

export type TrackerApi = ReturnType<typeof createApi>;
