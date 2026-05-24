const PRIVATE_LAN =
  /^(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

export function isDevLanOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return PRIVATE_LAN.test(hostname);
  } catch {
    return false;
  }
}

export function createCorsOriginChecker(
  allowedOrigins: "*" | string | string[],
) {
  const allowed: "*" | string[] =
    allowedOrigins === "*"
      ? "*"
      : typeof allowedOrigins === "string"
        ? [allowedOrigins]
        : allowedOrigins;

  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean | string) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowed === "*") {
      callback(null, true);
      return;
    }

    if (allowed.includes(origin)) {
      callback(null, origin);
      return;
    }

    if (process.env.NODE_ENV !== "production" && isDevLanOrigin(origin)) {
      callback(null, origin);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  };
}
