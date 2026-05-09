import "server-only";
import { getSqlClient } from "@/db";
import { getServerEnv } from "@/lib/env";

export type HealthStatus = {
  ok: boolean;
  process: "up";
  db: "not_configured" | "up" | "down";
  phase: "phase_1";
  commit: string;
  version: "2026-hackathon";
};

function baseHealthStatus(): Omit<HealthStatus, "ok" | "db"> {
  const env = getServerEnv();

  return {
    process: "up",
    phase: "phase_1",
    commit:
      env.RAILWAY_GIT_COMMIT_SHA ??
      env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GIT_COMMIT ??
      "local",
    version: "2026-hackathon",
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const env = getServerEnv();
  const base = baseHealthStatus();

  if (!env.DATABASE_URL) {
    return {
      ...base,
      ok: env.NODE_ENV !== "production",
      db: env.NODE_ENV === "production" ? "down" : "not_configured",
    };
  }

  try {
    await getSqlClient()`select 1`;
    return {
      ...base,
      ok: true,
      db: "up",
    };
  } catch {
    return {
      ...base,
      ok: false,
      db: "down",
    };
  }
}
