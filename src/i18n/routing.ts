import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "always",
});

// Type kept wider than the served locales: every component already
// branches on `locale === "ro"` and we only serve EN at the routing
// level. Narrowing AppLocale to "en" alone would force a 40+ file
// sweep to remove every dead RO branch, which is out of scope for the
// demo. URL routing only matches "en" -- RO branches are dead code at
// runtime but stay alive at the type level.
export type AppLocale = "en" | "ro";
