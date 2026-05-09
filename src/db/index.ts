import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getServerEnv } from "@/lib/env";

let sqlClient: postgres.Sql | undefined;
let drizzleClient: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getSqlClient() {
  if (sqlClient) {
    return sqlClient;
  }

  const { DATABASE_URL } = getServerEnv();
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database access");
  }

  sqlClient = postgres(DATABASE_URL, {
    max: 10,
    prepare: false,
  });

  return sqlClient;
}

export function getDb() {
  drizzleClient ??= drizzle(getSqlClient(), { schema });
  return drizzleClient;
}
