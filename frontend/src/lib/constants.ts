function isPrivateLanHost(hostname: string): boolean {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

export function getApiBase(): string {
  // Production / Render: always use the public API URL baked at build time.
  if (process.env.NEXT_PUBLIC_TRACKER_API_URL) {
    return process.env.NEXT_PUBLIC_TRACKER_API_URL;
  }

  // Phone on same Wi‑Fi: hit API on this machine's LAN IP (dev only).
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (isPrivateLanHost(hostname)) {
      return `http://${hostname}:4001`;
    }
  }

  return "http://localhost:4001";
}

/** @deprecated Prefer getApiBase() — static value is wrong on LAN clients. */
export const API_BASE = getApiBase();

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
