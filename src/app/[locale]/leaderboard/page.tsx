import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

// TODO(real-data): Wire to live leaderboard query once Wave 3 ships
// `/server/actions/leaderboard.ts`. For now we render seeded stubs so the
// page is a real surface and not a 404.
const PLAYERS = [
  { rank: 1, name: "Andrei Marin", points: 1240, sport: "football" as const },
  { rank: 2, name: "Vlad Ionescu", points: 1118, sport: "tennis" as const },
  { rank: 3, name: "Diana Popa", points: 990, sport: "running" as const },
  { rank: 4, name: "Maria Radu", points: 842, sport: "basketball" as const },
  { rank: 5, name: "Eli Stoica", points: 760, sport: "padel" as const },
];

const GROUPS = [
  { rank: 1, name: "Rozelor Football", members: 14, points: 5240 },
  { rank: 2, name: "Tenis Iulius", members: 8, points: 3870 },
  { rank: 3, name: "Sunrise Runners", members: 22, points: 3120 },
];

const ACHIEVEMENTS = [
  {
    title: "First Match",
    body: "You showed up to your first ShowUp2Move event.",
    glyph: "today" as const,
  },
  {
    title: "Captain",
    body: "You stepped up and ran an event from auto-create to kickoff.",
    glyph: "crown" as const,
  },
  {
    title: "Streak of 3",
    body: "Three weeks of ShowUpToday yeses in a row.",
    glyph: "pulse" as const,
  },
];

function rankColor(rank: number) {
  if (rank === 1) return "var(--accent)";
  if (rank === 2) return "var(--field)";
  if (rank === 3) return "var(--warn-token)";
  return "var(--ink-muted)";
}

export default async function LeaderboardPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="mx-auto w-full px-5 sm:px-8"
        style={{ maxWidth: "var(--page-max)", paddingTop: 24, paddingBottom: 32 }}
      >
        <header className="flex items-center justify-between" style={{ gap: 12 }}>
          <Link
            href={`/${locale}/today`}
            className="inline-flex min-h-11 items-center"
            style={{
              gap: 6,
              padding: "8px 12px",
              borderRadius: "var(--r-pill)",
              background: "var(--surface)",
              boxShadow: "inset 0 0 0 1px var(--line)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Glyph.back size={16} />
            Today
          </Link>
          <Pill variant="alt">Stub data · TODO</Pill>
        </header>

        <div style={{ marginTop: 24 }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Leaderboard
          </span>
          <h1
            className="display mt-2"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
            }}
          >
            Players this week
          </h1>
          <p
            className="mt-3 max-w-xl"
            style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            Points are awarded for showing up, captaining, and keeping streaks
            alive. Stub leaderboard — real ranking lands with the matching
            telemetry.
          </p>
        </div>

        {/* Players */}
        <Card variant="card" className="mt-6" style={{ padding: 0, overflow: "hidden" }}>
          <div
            role="row"
            className="grid items-center"
            style={{
              gridTemplateColumns: "60px 1fr 90px",
              padding: "12px 18px",
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="mono">Rank</span>
            <span className="mono">Player</span>
            <span className="mono" style={{ textAlign: "right" }}>
              Points
            </span>
          </div>
          {PLAYERS.map((p) => (
            <div
              key={p.rank}
              role="row"
              className="grid items-center"
              style={{
                gridTemplateColumns: "60px 1fr 90px",
                padding: "14px 18px",
                borderBottom:
                  p.rank === PLAYERS.length ? "0" : "1px solid var(--line)",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: rankColor(p.rank),
                }}
              >
                {p.rank.toString().padStart(2, "0")}
              </span>
              <span
                className="flex items-center"
                style={{ gap: 12, minWidth: 0 }}
              >
                <Avatar name={p.name} size={36} />
                <span style={{ minWidth: 0 }}>
                  <span
                    className="block truncate"
                    style={{ fontWeight: 600, fontSize: 15 }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--ink-muted)",
                      textTransform: "capitalize",
                    }}
                  >
                    {p.sport}
                  </span>
                </span>
              </span>
              <span
                className="mono"
                style={{
                  textAlign: "right",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {p.points.toLocaleString()}
              </span>
            </div>
          ))}
        </Card>

        {/* Top groups */}
        <h2
          className="display"
          style={{
            fontSize: 26,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Top groups
        </h2>
        <Card variant="card" style={{ padding: 0, overflow: "hidden" }}>
          {GROUPS.map((g, i) => (
            <div
              key={g.rank}
              className="grid items-center"
              style={{
                gridTemplateColumns: "60px 1fr 100px",
                padding: "14px 18px",
                borderBottom:
                  i === GROUPS.length - 1 ? "0" : "1px solid var(--line)",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: rankColor(g.rank),
                }}
              >
                {g.rank.toString().padStart(2, "0")}
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  className="block truncate"
                  style={{ fontWeight: 600, fontSize: 15 }}
                >
                  {g.name}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-muted)" }}
                >
                  {g.members} members
                </span>
              </span>
              <span
                className="mono"
                style={{
                  textAlign: "right",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {g.points.toLocaleString()}
              </span>
            </div>
          ))}
        </Card>

        {/* Achievements */}
        <h2
          className="display"
          style={{
            fontSize: 26,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          Achievements unlocked
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const Icon = a.glyph === "today"
              ? Glyph.today
              : a.glyph === "crown"
                ? Glyph.crown
                : Glyph.pulse;
            return (
              <Card key={a.title} variant="card" style={{ padding: 20 }}>
                <div className="flex items-center" style={{ gap: 12 }}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: "var(--accent-soft)",
                      color: "var(--accent-deep)",
                      display: "grid",
                      placeItems: "center",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                  <Badge variant="accent">Unlocked</Badge>
                </div>
                <h3
                  className="display mt-3"
                  style={{
                    fontSize: 18,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.15,
                  }}
                >
                  {a.title}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 13,
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {a.body}
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      <MobileTabBar />
    </main>
  );
}
