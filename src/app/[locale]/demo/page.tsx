import { sql } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DemoControls } from "@/components/demo/DemoControls";
import { DemoHealth } from "@/components/demo/DemoHealth";
import { RubricSection } from "@/components/demo/RubricSection";
import { Glyph } from "@/components/ui/Glyph";
import { getDb } from "@/db";
import type { AppLocale } from "@/i18n/routing";
import { ensureDemoSeeded } from "@/lib/demo/ensure-seeded";
import { isDemoModeEnabled } from "@/lib/demo/guard";
import {
  RUBRIC_CATEGORIES,
  RUBRIC_TOTAL_MAX,
  type RubricCategoryId,
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

  await ensureDemoSeeded();

  const t = await getTranslations("demo");
  const controlsCopy = {
    scriptedFlow: t("controls.scriptedFlow"),
  };
  const statusLabels = {
    live: t("rubricLegend.live"),
    seeded: t("rubricLegend.seeded"),
    fallback: t("rubricLegend.fallback"),
    pending: t("rubricLegend.pending"),
  };

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

  // Localized labels keyed by stable IDs from scoring-proofs.ts. Falls back to
  // the canonical English text if a key is ever missing in the locale file.
  const categoryLabel = (id: RubricCategoryId, fallback: string): string => {
    try {
      return t(`rubric.categories.${id}`);
    } catch {
      return fallback;
    }
  };
  const rowLabel = (id: string, fallback: string): string => {
    try {
      return t(`rubric.rows.${id}.label`);
    } catch {
      return fallback;
    }
  };
  const rowNote = (id: string, fallback: string | undefined): string | undefined => {
    if (!fallback) return undefined;
    try {
      return t(`rubric.rows.${id}.note`);
    } catch {
      return fallback;
    }
  };

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
          {t("eyebrow")}
        </p>
        <h1 className="display text-3xl sm:text-4xl">{t("title")}</h1>
        <p
          className="max-w-2xl text-[13px] leading-relaxed"
          style={{ color: "var(--ink-muted)" }}
        >
          {t("body")}
        </p>
      </header>

      <DemoHealth
        db={health.db}
        commit={health.commit}
        buildVersion={buildSha === health.commit ? "dev" : buildSha}
        seed={{ users, groups, events }}
        aiCacheEntries={aiCacheEntries}
        copy={{
          health: t("health.label"),
          healthUp: t("health.up"),
          healthDown: t("health.down"),
          healthUnknown: t("health.unknown"),
          seedLoaded: t("health.seedLoaded"),
          seedEmpty: t("health.seedEmpty"),
          seedEmptyHint: t("health.seedEmptyHint"),
          aiCache: t("health.aiCacheLoaded"),
          aiCacheEmpty: t("health.aiCacheEmpty"),
          aiCacheEmptyHint: t("health.aiCacheEmptyHint"),
          build: t("health.build"),
          seed: t("health.seed"),
          aiCacheLabel: t("health.aiCache"),
          ariaLabel: t("health.ariaLabel"),
        }}
      />

      <DemoControls locale={locale} copy={controlsCopy} />

      {/* Sticky category nav: anchors to each section, scrolls horizontally
          on narrow viewports so all caps stay reachable in one gesture. */}
      <nav
        aria-label={t("navAria")}
        className="sticky top-0 z-10 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6"
        style={{
          background:
            "color-mix(in oklab, var(--bg) 88%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RUBRIC_CATEGORIES.map((category) => (
            <li key={category.id} className="shrink-0">
              <a
                href={`#${category.id}`}
                className="mono inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  background: "var(--surface)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-pill)",
                }}
              >
                {categoryLabel(category.id, category.label)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="flex flex-col gap-7">
        {RUBRIC_CATEGORIES.map((category) => (
          <RubricSection
            key={category.id}
            id={category.id}
            label={categoryLabel(category.id, category.label)}
            rows={category.rows.map((row) => ({
              ...row,
              label: rowLabel(row.id, row.label),
              note: rowNote(row.id, row.note),
              evidence: localizeEvidence(row.evidence, locale),
            }))}
            statusLabels={statusLabels}
          />
        ))}
      </section>

      <footer
        className="mono mt-2 flex flex-col gap-2 px-3 py-3 text-[12px] tabular-nums sm:px-4"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-card)",
          color: "var(--ink)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold">
            {t("totals.total")} · {t("totals.claimed")}{" "}
            {summary.totalClaimed.toLocaleString()}p / {t("totals.max")}{" "}
            {RUBRIC_TOTAL_MAX.toLocaleString()}p
          </span>
          <Glyph.shield size={14} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <LegendChip
            label={statusLabels.live}
            color="var(--field)"
            soft="var(--field-soft)"
            count={summary.byStatus.live.count}
            points={summary.byStatus.live.points}
          />
          <LegendChip
            label={statusLabels.seeded}
            color="var(--accent-deep)"
            soft="var(--accent-soft)"
            count={summary.byStatus.seeded.count}
            points={summary.byStatus.seeded.points}
          />
          <LegendChip
            label={statusLabels.fallback}
            color="var(--warn-token)"
            soft="var(--warn-soft)"
            count={summary.byStatus.fallback.count}
            points={summary.byStatus.fallback.points}
          />
          <LegendChip
            label={statusLabels.pending}
            color="var(--ink-2)"
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
      className="inline-flex items-center gap-1 px-2 py-0.5 whitespace-nowrap"
      style={{
        background: soft,
        color,
        borderRadius: "var(--r-chip)",
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
