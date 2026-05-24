import path from "node:path";
import type { NextConfig } from "next";

const extraDevOrigins =
  process.env.TRACKER_DEV_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
  typedRoutes: true,
  ...(process.env.NODE_ENV !== "production" && {
    allowedDevOrigins: [
      "192.168.95.150",
      "192.168.*.*",
      "10.*.*.*",
      ...extraDevOrigins,
    ],
  }),
};

export default config;
