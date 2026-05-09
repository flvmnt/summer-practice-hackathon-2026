import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Railway forwards the container's bound port (3000) in the request's Host
// header, which next-intl copies into redirect Locations. Public traffic only
// reaches us via 443, so any Location with :3000 hangs the browser. The
// x-forwarded-host check skips this in local dev where :3000 is legitimate.
function stripInternalPort(response: Response, request: NextRequest): Response {
  if (response.status < 300 || response.status >= 400) return response;
  if (!request.headers.get("x-forwarded-host")) return response;

  const location = response.headers.get("location");
  if (!location) return response;

  const internalPort = process.env.PORT ?? "3000";

  try {
    const url = new URL(location, request.nextUrl);
    if (url.port === internalPort) {
      url.port = "";
      response.headers.set("location", url.toString());
    }
  } catch {
    // Non-URL Location header - leave it alone.
  }

  return response;
}

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  return stripInternalPort(response, request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
