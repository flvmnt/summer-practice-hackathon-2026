import { sql } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DemoControls } from "@/components/demo/DemoControls";
import { DemoHealth } from "@/components/demo/DemoHealth";
import { RubricSection } from "@/components/demo/RubricSection";
import { Glyph } from "@/components/ui/Glyph";
import { getDb } from "@/db";
import type { AppLocale } from "@/i18n/routing";
import { isDemoModeEnabled } from "@/lib/demo/guard";
import {
  RUBRIC_CATEGORIES,
  RUBRIC_TOTAL_MAX,
  summarizeRubric,
} from "@/lib/demo/scoring-proofs";
import { getServerEnv } from "@/lib/env";
import { getHealthStatus } from "@/lib/health";

export const dynamic = "force-dynamic";

type CountResult = { count: number };

async function safeCount(table: string): Promise<number> {
  try {
    const env = getServerEnv();
    if (!env.DATABASE_URL) return 0;
    const db = getDb();
    const rows = (await db.execute(
      sql.raw(`select count(*)::int as count from ${table}`),
    )) as unknown as CountResult[];
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

const COPY = {
  en: {
    eyebrow: "Judge Mode",
    title: "Rubric proof, live.",
    body: "Each row points to the screen or route that proves it. Status colors are honest: live (deployed), seeded (works against demo seed), fallback (limited; manual or cached), pending (not yet wired).",
    health: "Railway",
    healthUp: "green",
    healthDown: "red",
    healthUnknown: "yellow",
    seedLoaded: "{users} users · {groups} groups · {events} events",
    seedEmpty: "Empty",
    aiCache: "{count} entries cached",
    aiCacheEmpty: "Empty",
    build: "Build",
    controls: {
      seed: "Seed demo",
      seeding: "Seeding…",
      reset: "Reset demo",
      resetting: "Resetting…",
      scriptedFlow: "Open scripted flow",
      resetTitle: "Reset demo data?",
      resetBody:
        "This wipes demo-owned rows. Real accounts are protected by the demo_run_id ownership marker.",
      resetConfirm: "Reset",
      cancel: "Cancel",
      toastSeedOk: "Seeded",
      toastSeedFailed: "Seed failed",
      toastResetOk: "Reset complete",
      toastResetFailed: "Reset failed",
      notWired: "Action not wired yet — run scripts/seed-demo.ts from CLI.",
    },
    rubricLegend: {
      live: "Live",
      seeded: "Seeded",
      fallback: "Fallback",
      pending: "Pending",
    },
    totalsLabel: "Total",
    claimedLabel: "Claimed",
    maxLabel: "Max",
  },
  ro: {
    eyebrow: "Mod jurat",
    title: "Dovadă pe punctaj, live.",
    body: "Fiecare rând duce la ecranul sau ruta care îl dovedește. Culorile sunt oneste: live (deployat), seeded (cu date demo), fallback (limitat; manual sau cache), pending (nu este încă conectat).",
    health: "Railway",
    healthUp: "verde",
    healthDown: "roșu",
    healthUnknown: "galben",
    seedLoaded: "{users} useri · {groups} grupuri · {events} evenimente",
    seedEmpty: "Gol",
    aiCache: "{count} intrări în cache",
    aiCacheEmpty: "Gol",
    build: "Build",
    controls: {
      seed: "Populează demo",
      seeding: "Se populează…",
      reset: "Resetează demo",
      resetting: "Se resetează…",
      scriptedFlow: "Deschide flux scriptat",
      resetTitle: "Resetezi datele demo?",
      resetBody:
        "Șterge doar rândurile demo. Conturile reale sunt protejate prin demo_run_id.",
      resetConfirm: "Resetează",
      cancel: "Anulează",
      toastSeedOk: "Populat",
      toastSeedFailed: "Populare eșuată",
      toastResetOk: "Reset făcut",
      toastResetFailed: "Reset eșuat",
      notWired:
        "Acțiunea nu este conectată încă — rulează scripts/seed-demo.ts din CLI.",
    },
    rubricLegend: {
      live: "Live",
      seeded: "Demo",
      fallback: "Fallback",
      pending: "În lucru",
    },
    totalsLabel: "Total",
    claimedLabel: "Revendicat",
    maxLabel: "Maxim",
  },
} as const;

export default async function JudgeModePage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isDemoModeEnabled()) {
    notFound();
  }

  const copy = COPY[locale];

  const [health, users, groups, events, aiCacheEntries] = await Promise.all([
    getHealthStatus(),
    safeCount("users"),
    safeCount("groups"),
    safeCount("events"),
    safeCount("ai_cache"),
  ]);

  const summary = summarizeRubric();
  const buildSha =
    process.env.NEXT_PUBLIC_BUILD_SHA ?? health.commit ?? "dev";

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <header className="flex flex-col gap-2">
        <p
          className="mono text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--accent-deep)" }}
        >
          {copy.eyebrow}
        </p>
        <h1 className="display text-3xl sm:text-4xl">{copy.title}</h1>
        <p
          className="max-w-2xl text-[13px] leading-relaxed"
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.body}
        </p>
      </header>

      <DemoHealth
        db={health.db}
        commit={health.commit}
        buildVersion={buildSha === health.commit ? "dev" : buildSha}
        seed={{ users, groups, events }}
        aiCacheEntries={aiCacheEntries}
        copy={{
          health: copy.health,
          healthUp: copy.healthUp,
          healthDown: copy.healthDown,
          healthUnknown: copy.healthUnknown,
          seedLoaded: copy.seedLoaded,
          seedEmpty: copy.seedEmpty,
          aiCache: copy.aiCache,
          aiCacheEmpty: copy.aiCacheEmpty,
          build: copy.build,
        }}
      />

      <DemoControls locale={locale} copy={copy.controls} />

      <section className="flex flex-col gap-5">
        {RUBRIC_CATEGORIES.map((category) => (
          <RubricSection
            key={category.id}
            label={category.label}
            rows={category.rows.map((row) => ({
              ...row,
              evidence: localizeEvidence(row.evidence, locale),
            }))}
          />
        ))}
      </section>

      <footer
        className="mono mt-2 flex flex-col gap-2 px-3 py-3 text-[12px] tabular-nums"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-card)",
          color: "var(--ink)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold">
            {copy.totalsLabel} · {copy.claimedLabel}{" "}
            {summary.totalClaimed.toLocaleString()}p / {copy.maxLabel}{" "}
            {RUBRIC_TOTAL_MAX.toLocaleString()}p
          </span>
          <Glyph.shield size={14} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <LegendChip
            label={copy.rubricLegend.live}
            color="var(--field)"
            soft="var(--field-soft)"
            count={summary.byStatus.live.count}
            points={summary.byStatus.live.points}
          />
          <LegendChip
            label={copy.rubricLegend.seeded}
            color="var(--accent-deep)"
            soft="var(--accent-soft)"
            count={summary.byStatus.seeded.count}
            points={summary.byStatus.seeded.points}
          />
          <LegendChip
            label={copy.rubricLegend.fallback}
            color="var(--warn-token)"
            soft="var(--warn-soft)"
            count={summary.byStatus.fallback.count}
            points={summary.byStatus.fallback.points}
          />
          <LegendChip
            label={copy.rubricLegend.pending}
            color="var(--ink-muted)"
            soft="var(--surface-2)"
            count={summary.byStatus.pending.count}
            points={summary.byStatus.pending.points}
          />
        </div>
      </footer>
    </main>
  );
}

function LegendChip({
  label,
  color,
  soft,
  count,
  points,
}: {
  label: string;
  color: string;
  soft: string;
  count: number;
  points: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5"
      style={{
        background: soft,
        color,
        borderRadius: 6,
      }}
    >
      <span className="font-bold uppercase tracking-[0.12em]">{label}</span>
      <span style={{ opacity: 0.85 }}>
        {count} · {points.toLocaleString()}p
      </span>
    </span>
  );
}

function localizeEvidence(
  evidence: string | undefined,
  locale: AppLocale,
): string | undefined {
  if (!evidence) return undefined;
  if (evidence.startsWith("http") || evidence.startsWith("/api")) {
    return evidence;
  }
  if (evidence.startsWith(`/${locale}`)) {
    return evidence;
  }
  if (evidence.startsWith("/")) {
    return `/${locale}${evidence}`;
  }
  return evidence;
}
