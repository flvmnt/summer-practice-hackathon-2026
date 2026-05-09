import "server-only";
import { headers } from "next/headers";

export async function getRequestIp() {
  const headerStore = await headers();
  const directProxyIp =
    headerStore.get("cf-connecting-ip") ??
    headerStore.get("x-real-ip") ??
    headerStore.get("fly-client-ip");

  if (directProxyIp) {
    return directProxyIp.trim() || "unknown";
  }

  return "unknown";
}
