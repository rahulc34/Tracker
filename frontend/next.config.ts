import path from "node:path";
import type { NextConfig } from "next";

const extraDevOrigins =
  process.env.TRACKER_DEV_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const proxyApi = process.env.TRACKER_PROXY_API === "true";
const apiPort = process.env.TRACKER_API_PORT ?? "4001";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, ".."),
  typedRoutes: true,
  ...(proxyApi && {
    async rewrites() {
      const target = `http://127.0.0.1:${apiPort}`;
      return [
        { source: "/health", destination: `${target}/health` },
        { source: "/api/:path*", destination: `${target}/api/:path*` },
      ];
    },
  }),
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
