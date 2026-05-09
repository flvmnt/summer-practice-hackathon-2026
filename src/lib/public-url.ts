import "server-only";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

export function toPublicUrl(path: string, request: NextRequest): URL {
  const publicBaseUrl = getServerEnv().PUBLIC_BASE_URL;
  return new URL(path, publicBaseUrl ?? request.url);
}
