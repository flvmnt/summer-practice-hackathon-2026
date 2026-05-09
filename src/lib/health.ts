import "server-only";
import { getServerEnv } from "@/lib/env";

export type HealthStatus = {
  ok: true;
  process: "up";
  db: "not_configured";
  phase: "phase_0";
  commit: string;
  version: "2026-hackathon";
};

export function getHealthStatus(): HealthStatus {
  const env = getServerEnv();

  return {
    ok: true,
    process: "up",
    db: "not_configured",
    phase: "phase_0",
    commit:
      env.RAILWAY_GIT_COMMIT_SHA ??
      env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GIT_COMMIT ??
      "local",
    version: "2026-hackathon",
  };
}
