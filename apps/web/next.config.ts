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
};

export default config;
