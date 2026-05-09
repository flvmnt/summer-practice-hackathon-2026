import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { IcsExportButton } from "@/components/event/IcsExportButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { ToastProvider } from "@/components/ui/Toast";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type StubEvent = {
  id: string;
  sport: string;
  title: string;
  whenAt: string;
  durationMin: number;
  venue: string;
  rsvp: "going" | "tentative";
};

// TODO(real-data): Wire to live `getMyEventsAction()` once Wave 2 server actions
// land. For now we render seeded stubs so judges can grab a working .ics for
// the demo flow without needing a full event create.
function buildStubEvents(): StubEvent[] {
  const now = new Date();
  const next = (offsetDays: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "stub-1",
      sport: "Football",
      title: "Pickup football · Parcul Rozelor",
      whenAt: next(1, 18),
      durationMin: 90,
      venue: "Parcul Rozelor",
      rsvp: "going",
    },
    {
      id: "stub-2",
      sport: "Tennis",
      title: "Doubles tennis · Tenis Club",
      whenAt: next(3, 19),
      durationMin: 60,
      venue: "Tenis Club Iulius",
      rsvp: "going",
    },
    {
      id: "stub-3",
      sport: "Basketball",
      title: "3v3 basketball · Sports Park",
      whenAt: next(5, 17),
      durationMin: 75,
      venue: "Iulius Sports Park",
      rsvp: "tentative",
    },
  ];
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export default async function CalendarPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const events = buildStubEvents();

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
            Calendar
          </span>
          <h1
            className="display mt-2"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
            }}
          >
            Your calendar
          </h1>
          <p
            className="mt-3 max-w-xl"
            style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            Confirmed events you said yes to. Each row exports a clean{" "}
            <span className="mono" style={{ fontSize: 13 }}>
              .ics
            </span>{" "}
            you can drop into Apple/Google Calendar.
          </p>
        </div>

        <h2
          className="display"
          style={{
            fontSize: 22,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginTop: 28,
            marginBottom: 12,
          }}
        >
          Upcoming events
        </h2>

        {events.length === 0 ? (
          <Card variant="card" style={{ padding: 0 }}>
            <EmptyState
              glyph={<Glyph.cal size={28} />}
              title="No events yet"
              body="Say yes on Today and we will find you a group. Confirmed events show up here with a one-tap calendar export."
              action={{ label: "Open Today", href: `/${locale}/today` }}
            />
          </Card>
        ) : null}

        {events.length > 0 ? (
          <ToastProvider>
            <div className="grid gap-3">
              {events.map((evt) => (
                <Card
                  key={evt.id}
                  variant="card"
                  style={{ padding: 18 }}
                >
                  <div
                    className="grid items-center gap-4 sm:grid-cols-[1fr_auto]"
                    style={{ gap: 16 }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="flex items-center"
                        style={{ gap: 8, marginBottom: 8 }}
                      >
                        <Pill variant={evt.rsvp === "going" ? "field" : "alt"}>
                          {evt.rsvp === "going" ? "Going" : "Tentative"}
                        </Pill>
                        <span
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: "var(--ink-muted)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          {evt.sport}
                        </span>
                      </div>
                      <h3
                        className="display"
                        style={{
                          fontSize: 18,
                          letterSpacing: "-0.015em",
                          lineHeight: 1.2,
                        }}
                      >
                        {evt.title}
                      </h3>
                      <div
                        className="mt-2 flex flex-wrap items-center"
                        style={{
                          gap: 14,
                          fontSize: 13,
                          color: "var(--ink-muted)",
                        }}
                      >
                        <span className="inline-flex items-center" style={{ gap: 6 }}>
                          <Glyph.clock size={14} />
                          {formatWhen(evt.whenAt)}
                        </span>
                        <span className="inline-flex items-center" style={{ gap: 6 }}>
                          <Glyph.pin size={14} />
                          {evt.venue}
                        </span>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {evt.durationMin} min
                        </span>
                      </div>
                    </div>
                    <div style={{ minWidth: 180 }}>
                      <IcsExportButton
                        eventId={evt.id}
                        title={evt.title}
                        whenAt={evt.whenAt}
                        durationMin={evt.durationMin}
                        venueName={evt.venue}
                        label="Download .ics"
                        toastTitle="Calendar file ready"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ToastProvider>
        ) : null}
      </div>

      <MobileTabBar />
    </main>
  );
}
