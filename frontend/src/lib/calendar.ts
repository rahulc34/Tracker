const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type CalendarDay = {
  day: number;
  dateKey: string;
  weekday: string;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export function toDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function todayDateKey(today = new Date()): string {
  return toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
}

export function isPastDateKey(dateKey: string, today = new Date()): boolean {
  return dateKey < todayDateKey(today);
}

export function isCurrentYear(yearNumber: number, today = new Date()): boolean {
  return yearNumber === today.getFullYear();
}

export function isCurrentMonth(
  yearNumber: number,
  monthIndex: number,
  today = new Date(),
): boolean {
  return (
    yearNumber === today.getFullYear() &&
    monthIndex === today.getMonth() + 1
  );
}

export function buildMonthCalendar(
  year: number,
  monthIndex: number,
  today = new Date(),
): CalendarDay[] {
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const todayKey = todayDateKey(today);

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateKey = toDateKey(year, monthIndex, day);
    const weekday = WEEKDAY_LABELS[new Date(year, monthIndex - 1, day).getDay()]!;
    return {
      day,
      dateKey,
      weekday,
      isPast: dateKey < todayKey,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    };
  });
}

/** Days in this month from today through the last day of the month. */
export function buildAssignableDays(
  year: number,
  monthIndex: number,
  today = new Date(),
): CalendarDay[] {
  return buildMonthCalendar(year, monthIndex, today).filter((d) => !d.isPast);
}

export function formatShortDate(isoOrKey: string): string {
  const key = isoOrKey.includes("T") ? dateKeyFromIso(isoOrKey) : isoOrKey;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
