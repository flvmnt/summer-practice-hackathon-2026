import "server-only";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

function firstForwardedValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function getForwardedOrigin(request: NextRequest): string | null {
  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  if (!forwardedHost) return null;

  const forwardedProto =
    firstForwardedValue(request.headers.get("x-forwarded-proto")) ?? "https";
  return `${forwardedProto}://${forwardedHost}`;
}

export function toPublicUrl(path: string, request: NextRequest): URL {
  const publicBaseUrl = getServerEnv().PUBLIC_BASE_URL;
  return new URL(path, publicBaseUrl ?? getForwardedOrigin(request) ?? request.url);
}
