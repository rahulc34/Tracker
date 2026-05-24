export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    const isLan =
      hostname !== "localhost" && hostname !== "127.0.0.1";
    if (isLan) {
      return `http://${hostname}:4001`;
    }
  }

  if (process.env.NEXT_PUBLIC_TRACKER_API_URL) {
    return process.env.NEXT_PUBLIC_TRACKER_API_URL;
  }

  return "http://localhost:4001";
}

/** @deprecated Prefer getApiBase() — static value is wrong on LAN clients. */
export const API_BASE = getApiBase();

export const DEFAULT_USER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_USER_ID ??
  "00000000-0000-4000-8000-000000000001";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
