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

function rawCommit() {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT ??
    "local"
  );
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const base: Omit<HealthStatus, "ok" | "db"> = {
    process: "up",
    phase: "phase_1",
    commit: rawCommit(),
    version: "2026-hackathon",
  };

  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch {
    return { ...base, ok: false, db: "down" };
  }

  if (!env.DATABASE_URL) {
    return {
      ...base,
      ok: env.NODE_ENV !== "production",
      db: env.NODE_ENV === "production" ? "down" : "not_configured",
    };
  }

  try {
    await getSqlClient()`select 1`;
    return { ...base, ok: true, db: "up" };
  } catch {
    return { ...base, ok: false, db: "down" };
  }
}
