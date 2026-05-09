#!/usr/bin/env node
/**
 * Lightweight wrapper that points Playwright at the visual.spec.ts harness
 * and assumes the dev/prod server is already running on PLAYWRIGHT_BASE_URL.
 *
 * Usage:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 node scripts/visual-qa/run.mjs
 */
import { spawnSync } from "node:child_process";

const args = [
  "exec",
  "playwright",
  "test",
  "e2e/visual.spec.ts",
  "--reporter=list",
  "--project=chromium",
  "--config=scripts/visual-qa/playwright.visual.config.ts",
];

const env = {
  ...process.env,
  PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100",
};

const r = spawnSync("pnpm", args, { stdio: "inherit", env });
process.exit(r.status ?? 1);
