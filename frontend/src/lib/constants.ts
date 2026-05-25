function isPrivateLanHost(hostname: string): boolean {
  return (
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

export function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_TRACKER_API_URL?.trim();
  if (configured) {
    return configured;
  }

  // Render monolith: browser uses same origin; Next rewrites /api → Express.
  if (process.env.NEXT_PUBLIC_TRACKER_PROXY_API === "true") {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    if (process.env.TRACKER_API_INTERNAL_URL) {
      return process.env.TRACKER_API_INTERNAL_URL.replace(/\/$/, "");
    }
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
