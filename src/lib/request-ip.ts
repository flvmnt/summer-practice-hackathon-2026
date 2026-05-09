import "server-only";
import { isIP } from "node:net";
import { headers } from "next/headers";

type HeaderGetter = (name: string) => string | null;

function normalizedIp(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) {
    return null;
  }

  return isIP(candidate) ? candidate : null;
}

function forwardedForIp(value: string | null) {
  const forwardedIps = value
    ?.split(",")
    .map((part) => normalizedIp(part))
    .filter((part): part is string => Boolean(part));

  return forwardedIps?.at(-1) ?? null;
}

export function getRequestIpFromHeaders(getHeader: HeaderGetter) {
  const directProxyIp =
    normalizedIp(getHeader("cf-connecting-ip")) ??
    normalizedIp(getHeader("x-real-ip")) ??
    normalizedIp(getHeader("fly-client-ip"));

  if (directProxyIp) {
    return directProxyIp;
  }

  return forwardedForIp(getHeader("x-forwarded-for")) ?? "unknown";
}

export async function getRequestIp() {
  const headerStore = await headers();
  return getRequestIpFromHeaders((name) => headerStore.get(name));
}
