import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { EventScreen, type EventScreenCopy } from "@/components/event/EventScreen";
import type { RsvpStatus } from "@/components/event/RsvpButtons";
import type { AppLocale } from "@/i18n/routing";
import {
  generateCaptainBrief,
  type CaptainBrief,
  type WeatherKind,
} from "@/lib/ai/captain-brief";
import { getEventAction, getGroupAction } from "@/lib/chat";
import type { SportKey } from "@/lib/sports";
import { getOpenMeteoForecast, type WeatherFit } from "@/lib/weather";

export const dynamic = "force-dynamic";

function weatherKindFromFit(fit: WeatherFit | null): WeatherKind {
  if (fit === "outdoor_good") return "sunny";
  if (fit === "indoor_recommended") return "rainy";
  return "cloudy";
}

function asRsvp(status: string | undefined): RsvpStatus {
  if (status === "going" || status === "maybe" || status === "declined") {
    return status;
  }
  return "going";
}

export default async function EventPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; eventId: string }>;
}>) {
  const { locale, eventId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("event");
  const result = await getEventAction({ eventId });

  if (!result.ok) {
    redirect(`/${locale}/today`);
  }

  const { event, attendees, messages, venueCandidates, venueVote, currentUserId } =
    result.data;

  // Captain check — query the group via the existing action so we don't touch
  // chat.ts. Falls back to "not captain" if group fetch fails.
  const groupResult = await getGroupAction({ groupId: event.groupId });
  const isCaptain = groupResult.ok
    ? groupResult.data.group.captainUserId === currentUserId
    : false;

  // Pick recommended venue (rank 1 = first in deterministic order).
  const recommended = venueCandidates[0] ?? null;
  const weather = recommended
    ? await getOpenMeteoForecast({
        lat: recommended.lat,
        lng: recommended.lng,
        whenAt: event.whenAt,
        sport: event.sport,
      })
    : null;

  const sportLabel = t(`sports.${event.sport as SportKey}`);
  const whenFmt = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  });
  const timeFmt = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  });
  const startsAt = new Date(event.whenAt);
  const endsAt = new Date(startsAt.getTime() + event.durationMin * 60_000);
  const whenLabel = whenFmt.format(startsAt);
  const whenRange = `${timeFmt.format(startsAt)} – ${timeFmt.format(endsAt)}`;

  const myAttendee = attendees.find((a) => a.userId === currentUserId);
  const initialRsvp = asRsvp(myAttendee?.status);

  const fit: WeatherFit | null = weather ? (weather.fit as WeatherFit) : null;

  // Captain brief — server-side, on-demand. The lib has a deterministic
  // fallback and never throws on input; wrap in try/catch as belt-and-
  // suspenders so a transient AI provider failure never tanks the page.
  const goingCount = attendees.filter((a) => a.status === "going").length;
  const groupSize = goingCount > 0 ? goingCount : attendees.length;
  let captainBrief: { brief: CaptainBrief; source: "ai" | "fallback" } | null =
    null;
  if (groupSize > 0) {
    try {
      captainBrief = await generateCaptainBrief({
        groupSize,
        sport: event.sport,
        weather: weatherKindFromFit(fit),
        candidateVenues: venueCandidates.map((c) => ({
          name: c.name,
          distanceKm: c.distanceKm ? Number(c.distanceKm) : 0,
        })),
      });
    } catch {
      captainBrief = null;
    }
  }

  const copy: EventScreenCopy = {
    back: t("back"),
    tabs: {
      details: locale === "ro" ? "Detalii" : "Details",
      chat: locale === "ro" ? "Chat eveniment" : "Event chat",
      vote: locale === "ro" ? "Vot" : "Vote",
    },
    details: {
      sportLabel: t("title", { sport: sportLabel }),
      whenLabel,
      durationLabel: t("duration", { minutes: event.durationMin }),
      venuePending: t("venuePending"),
      weatherTitle: t("weatherTitle"),
      weatherFit: {
        outdoor_good: t("weatherFit.outdoor_good"),
        indoor_recommended: t("weatherFit.indoor_recommended"),
        wind_warning: t("weatherFit.wind_warning"),
        cold_warning: t("weatherFit.cold_warning"),
      },
      weatherMetrics: weather
        ? t("weatherMetrics", {
            temperature: Math.round(weather.temperatureC),
            rain: Math.round(weather.rainProbability),
            wind: Math.round(weather.windKmh),
          })
        : "",
      directions: t("directions"),
      copyInvite: locale === "ro" ? "Copiază invitația" : "Copy invite",
      inviteCopied: locale === "ro" ? "Invitație copiată" : "Invite copied",
      inviteCopyError:
        locale === "ro" ? "Nu s-a putut copia" : "Could not copy",
      ics: t("calendar"),
      icsToast:
        locale === "ro" ? "Calendar descărcat" : "Calendar downloaded",
      rsvp: {
        going: t("attendeeStatuses.going"),
        maybe: t("attendeeStatuses.maybe"),
        no: t("attendeeStatuses.declined"),
        saved: locale === "ro" ? "RSVP actualizat" : "RSVP updated",
      },
      mapPreviewLabel: locale === "ro" ? "Previzualizare hartă" : "Map preview",
      priceTier: recommended
        ? t(`priceTiers.${recommended.priceTier}`)
        : "",
      distanceKm: recommended?.distanceKm ?? null,
    },
    chat: {
      title: t("chatTitle"),
      empty: t("emptyChat"),
      system: t("system"),
      form: t.raw("form"),
    },
    vote: {
      title:
        locale === "ro"
          ? "Vot: alegeți o locație"
          : "Vote: choose a venue",
      closeVote: locale === "ro" ? "Închide votul" : "Close vote",
      closedNotice:
        locale === "ro" ? "Votul este închis." : "Voting is closed.",
    },
    captainReveal: {
      pillLabel:
        locale === "ro" ? "Sugestie auto pentru căpitan" : "Captain auto-suggest",
      versionLabel: "auto · v1",
      headline: locale === "ro" ? "Plan sugerat" : "Suggested plan",
      whenRange:
        locale === "ro" ? `Astăzi, ${whenRange}` : `Today, ${whenRange}`,
      reasoning:
        locale === "ro"
          ? "8 membri au votat după 18:00, vremea este senină, iar locația este cea mai apropiată de centrul grupului."
          : "8 members voted after 18:00, weather is clear, venue is closest to the group center.",
      recommendedSubLine: recommended
        ? [
            recommended.distanceKm ? `${recommended.distanceKm} km` : null,
            t(`priceTiers.${recommended.priceTier}`),
          ]
            .filter(Boolean)
            .join(" · ")
        : "",
      alternateNames: venueCandidates.slice(1, 3).map((c) => c.name),
      alternateLines: venueCandidates
        .slice(1, 3)
        .map((c) =>
          [
            c.distanceKm ? `${c.distanceKm} km` : null,
            t(`priceTiers.${c.priceTier}`),
          ]
            .filter(Boolean)
            .join(" · "),
        ),
      confirmPlan: locale === "ro" ? "Confirmă planul" : "Confirm plan",
      startVote: locale === "ro" ? "Pornește votul" : "Start vote",
      suggestSomethingElse:
        locale === "ro" ? "Sugerează altceva" : "Suggest something else",
      suggestSomethingElseToast:
        locale === "ro" ? "În curând" : "Coming soon",
      confirmedToast:
        locale === "ro" ? "Plan confirmat" : "Plan confirmed",
    },
    captainBrief: {
      header: t("captainBrief.header"),
      sourceAi: t("captainBrief.sourceAi"),
      sourceFallback: t("captainBrief.sourceFallback"),
      reasonLabel: t("captainBrief.reasonLabel"),
      decisionsLabel: t("captainBrief.decisionsLabel"),
      decisionLabels: {
        venue: t("captainBrief.decisionLabels.venue"),
        time: t("captainBrief.decisionLabels.time"),
        team: t("captainBrief.decisionLabels.team"),
      },
    },
    status: {
      proposed: t("statuses.proposed"),
      confirmed: t("statuses.confirmed"),
      cancelled: t("statuses.cancelled"),
    },
  };

  const venueForScreen = recommended
    ? {
        name: recommended.name,
        lat: recommended.lat ? Number(recommended.lat) : null,
        lng: recommended.lng ? Number(recommended.lng) : null,
        distanceKm: recommended.distanceKm,
        priceTier: recommended.priceTier,
        fit: (fit ?? "outdoor_good") as WeatherFit,
      }
    : null;

  return (
    <EventScreen
      copy={copy}
      locale={locale}
      groupHref={`/${locale}/groups/${event.groupId}`}
      currentUserId={currentUserId}
      isCaptain={isCaptain}
      event={{
        id: event.id,
        sport: event.sport,
        status: event.status,
        whenAt: event.whenAt,
        durationMin: event.durationMin,
      }}
      venue={venueForScreen}
      weather={
        weather
          ? {
              fit: weather.fit as WeatherFit,
              temperatureC: weather.temperatureC,
              rainProbability: weather.rainProbability,
              windKmh: weather.windKmh,
            }
          : null
      }
      initialRsvp={initialRsvp}
      messages={messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        user: m.user ? { id: m.user.id, fullName: m.user.fullName } : null,
      }))}
      venueOptions={venueCandidates.map((c) => ({
        optionIdx: c.optionIdx,
        venueId: c.venueId,
        name: c.name,
        votes: c.votes,
      }))}
      totalAttendees={attendees.length}
      myVoteOptionIdx={venueVote?.selectedOptionIdx ?? null}
      voteOpen={venueVote ? venueVote.status === "open" : false}
      captainBrief={captainBrief}
    />
  );
}
