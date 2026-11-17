// Next.js config: loads the monorepo root .env in development and transpiles the shared contracts package.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Local secrets live in the monorepo root .env (never committed). On Vercel, env vars are set in the project.
const rootEnv = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const config: NextConfig = {
  transpilePackages: ["@mb/contracts"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Local only: lets a phone on the same network load the dev server, e.g. DEV_ORIGINS=192.168.1.20.
  allowedDevOrigins: process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(",") : [],
  // Landing pages: no framing by other sites (the panel demo is framed by this same origin), no sniffing,
  // no referrer leaks and no device APIs. The API routes set their own headers in lib/server.ts.
  async headers() {
    return [
      {
        source: "/((?!api/).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default config;
