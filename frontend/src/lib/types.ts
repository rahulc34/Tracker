export type YearSummary = {
  id: string;
  yearNumber: number;
  progress: number;
  yearlySkillCount: number;
  monthlySkillCount: number;
  activeMonthCount: number;
  monthTracks: { monthId: string; monthIndex: number; progress: number }[];
};

export type RootOverview = {
  overallProgress: number;
  activeYearCount: number;
  completedSkillCount: number;
  totalSkillCount: number;
  years: YearSummary[];
};

export type YearRecord = {
  id: string;
  userId: string;
  yearNumber: number;
  createdAt: string;
  _count?: { skills: number; months: number };
};

export type MonthRecord = {
  id: string;
  yearId: string;
  monthIndex: number;
  isActive: boolean;
};

export type SubSkill = {
  id: string;
  title: string;
  progress: number;
  isCompleted: boolean;
};

export type SkillResource = {
  id: string;
  type: "folder" | "link" | "note" | "file";
  title: string;
  url?: string | null;
  content?: string | null;
  parentId?: string | null;
  children?: SkillResource[];
};

export type SkillSummary = {
  id: string;
  title: string;
  scope: "yearly" | "monthly";
  tag: string;
  progress: number;
  isCompleted: boolean;
  estimatedDays?: number | null;
  linkCount?: number;
  noteCount?: number;
  resourceCount?: number;
  subSkillTags?: string[];
  subSkills?: SubSkill[];
  resources?: SkillResource[];
  description?: string | null;
  startedAt?: string | null;
};

export type YearOverview = {
  id: string;
  yearNumber: number;
  progress: number;
  monthTracks: (MonthRecord & { progress: number })[];
  yearlyPlans: SkillSummary[];
  monthlyPool: SkillSummary[];
  assignedMonthlyCount: number;
};

export type AssignmentEvent = {
  id: string;
  eventDate: string;
  eventType: string;
  status: string;
  note?: string | null;
  sequence: number;
};

export type DatePin = {
  id: string;
  pinnedDate: string;
  isReassignment: boolean;
  skillId?: string;
  skillTitle?: string;
  assignmentId?: string;
};

export type MonthAssignment = {
  id: string;
  status: string;
  createdAt?: string;
  currentTargetDate?: string | null;
  skill: SkillSummary;
  events?: AssignmentEvent[];
  datePins?: DatePin[];
};

export type MonthOverview = {
  id: string;
  monthIndex: number;
  yearId: string;
  yearNumber: number;
  progress: number;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  overdueCount: number;
  assignments: MonthAssignment[];
  poolSkills: SkillSummary[];
  datePins: DatePin[];
};

export type SkillDetail = SkillSummary & {
  year: { id: string; yearNumber: number };
  parent?: { id: string; title: string } | null;
  subSkills: SubSkill[];
  resources: SkillResource[];
  resourceTree: SkillResource[];
  assignments: (Omit<MonthAssignment, "skill"> & {
    month: MonthRecord;
    events: AssignmentEvent[];
    datePins: DatePin[];
  })[];
};

export type UserBookmark = {
  id: string;
  userId: string;
  category: "vault" | "profile";
  kind: "folder" | "link";
  parentId?: string | null;
  platform: string;
  title: string;
  url?: string | null;
  note?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VaultBookmarkNode = UserBookmark & {
  children: VaultBookmarkNode[];
};

export type VaultBookmarksResponse = {
  items: UserBookmark[];
  tree: VaultBookmarkNode[];
};
