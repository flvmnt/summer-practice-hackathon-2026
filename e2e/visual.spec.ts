/**
 * Visual QA harness. NOT part of the regular Playwright test suite — it
 * lives outside `src/tests/e2e/` so `pnpm test:e2e` is unaffected.
 *
 * Run manually:
 *   pnpm exec playwright test e2e/visual.spec.ts \
 *     --reporter=list --project=chromium \
 *     --config=scripts/visual-qa/playwright.visual.config.ts
 *
 * Generates `_review/screenshots/{slug}-{viewport}.png` plus a JSON index
 * at `_review/screenshots/index.json` with HTTP status + console errors
 * captured per route.
 */
import {
  test,
  expect,
  type ConsoleMessage,
  type Page,
} from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

type Viewport = { name: string; width: number; height: number };

const VIEWPORTS: Viewport[] = [
  { name: "360w", width: 360, height: 800 },
  { name: "375w", width: 375, height: 812 },
  { name: "390w", width: 390, height: 844 },
  { name: "768w", width: 768, height: 1024 },
  { name: "1440w", width: 1440, height: 900 },
];

const ROUTES: Array<{ slug: string; path: string; note?: string }> = [
  { slug: "landing-en", path: "/en" },
  { slug: "landing-ro", path: "/ro" },
  { slug: "signup", path: "/en/signup" },
  { slug: "login", path: "/en/login" },
  { slug: "recover", path: "/en/recover" },
  { slug: "onboarding-profile", path: "/en/onboarding/profile" },
  { slug: "onboarding-sports", path: "/en/onboarding/sports" },
  { slug: "onboarding-location", path: "/en/onboarding/location" },
  { slug: "onboarding-photo", path: "/en/onboarding/photo" },
  { slug: "today", path: "/en/today" },
  { slug: "groups", path: "/en/groups" },
  { slug: "groups-detail", path: "/en/groups/seed-id", note: "no seed; expect 404 or redirect" },
  { slug: "events", path: "/en/events" },
  { slug: "events-new", path: "/en/events/new" },
  { slug: "events-detail", path: "/en/events/seed-id", note: "no seed; expect 404 or redirect" },
  { slug: "notifications", path: "/en/notifications" },
  { slug: "map", path: "/en/map" },
  { slug: "demo", path: "/en/demo" },
  { slug: "settings", path: "/en/settings" },
  { slug: "u-username", path: "/en/u/seed", note: "no seed username" },
  { slug: "leaderboard", path: "/en/leaderboard" },
  { slug: "calendar", path: "/en/calendar" },
];

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const VIEWPORT_FILTER = readFilter(process.env.VISUAL_VIEWPORTS);
const ROUTE_FILTER = readFilter(process.env.VISUAL_ROUTES);
const ACTIVE_VIEWPORTS = VIEWPORT_FILTER
  ? VIEWPORTS.filter((vp) => VIEWPORT_FILTER.has(vp.name))
  : VIEWPORTS;
const ACTIVE_ROUTES = ROUTE_FILTER
  ? ROUTES.filter((route) => ROUTE_FILTER.has(route.slug))
  : ROUTES;

const OUT_DIR = path.resolve(__dirname, "..", "_review", "screenshots");

type Capture = {
  slug: string;
  path: string;
  viewport: string;
  status: number | null;
  consoleErrors: string[];
  pageErrors: string[];
  screenshot: string;
  finalUrl: string;
  note?: string;
};

const index: Capture[] = [];

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function readFilter(raw: string | undefined): Set<string> | null {
  if (!raw) return null;
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? new Set(values) : null;
}

async function shoot(
  page: Page,
  slug: string,
  vp: Viewport,
  pathname: string,
  note?: string,
): Promise<Capture> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err: Error) => {
    pageErrors.push(err.message);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  await page.setViewportSize({ width: vp.width, height: vp.height });

  let status: number | null = null;
  try {
    const resp = await page.goto(`${BASE}${pathname}`, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    status = resp?.status() ?? null;
    // Give the page a beat to settle (fonts, images).
    await page.waitForTimeout(800);
  } catch (err) {
    pageErrors.push(`navigation failed: ${(err as Error).message}`);
  }

  const file = path.join(OUT_DIR, `${slug}-${vp.name}.png`);
  ensureDir(OUT_DIR);
  try {
    await page.screenshot({ path: file, fullPage: true });
  } catch {
    // ignore capture errors; the index records navigation/page failures.
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  return {
    slug,
    path: pathname,
    viewport: vp.name,
    status,
    consoleErrors,
    pageErrors,
    screenshot: path.relative(path.resolve(__dirname, ".."), file),
    finalUrl: page.url(),
    note,
  };
}

test.describe.configure({ mode: "serial" });

test("capture screenshot matrix", async ({ browser }) => {
  test.setTimeout(15 * 60_000);

  ensureDir(OUT_DIR);

  for (const vp of ACTIVE_VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();

    for (const route of ACTIVE_ROUTES) {
      const cap = await shoot(page, route.slug, vp, route.path, route.note);
      index.push(cap);
      console.log(
        `[${vp.name}] ${cap.slug} -> ${cap.status ?? "?"}  ${cap.consoleErrors.length ? "(console errs: " + cap.consoleErrors.length + ")" : ""}`,
      );
    }

    await ctx.close();
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(index, null, 2),
  );

  const failures = index.filter(
    (cap) =>
      cap.status === null ||
      cap.status >= 500 ||
      cap.pageErrors.length > 0,
  );

  expect(index.length).toBeGreaterThan(0);
  expect(
    failures.map((cap) => ({
      slug: cap.slug,
      viewport: cap.viewport,
      status: cap.status,
      finalUrl: cap.finalUrl,
      pageErrors: cap.pageErrors,
    })),
  ).toEqual([]);
});
