# 06 - Phase 4: Location, Map & Venue Audit

Audit date: 2026-05-09
Specs: `docs/specs/12-implementation-plan.md` §6 (Phase 4 - venue/map/auto-event subset), `docs/specs/05-ai-features.md` (venues/maps/auto-event), `docs/specs/14-matching-and-event-algorithm.md` §8–§11 (venue ranking, price tier, auto-event flow)

## Headline

Phase 4 location/map subset is **mostly PARTIAL with one outright MISSING task**. MapLibre is correctly lazy-loaded behind `next/dynamic` with an SVG fallback, the geolocation-denied fallback list works, and Google/Apple/Waze deep links exist on the public Map sheet. But Overpass is **MISSING entirely** (no code, only a CSP allowlist entry and prose claiming it exists), the price-tier heuristic is hard-coded seed data rather than a tag-based heuristic, `priceConfidence` is plumbed through DB → action → page props but **never rendered to the user**, and the auto-event setup flow stops at a toast (`confirmEventAction` is explicitly TODO in `CaptainAutoEventReveal`). Public `/map` page also resets `priceTier` to `0` for every venue, dropping that field on the read path.

Demo proof in `src/lib/demo/scoring-proofs.ts:217-247` claims *"Seeded venues + Overpass cache + manual entry. Price confidence labeled."* - the Overpass cache and the visible price-confidence label do not exist in code.

## Verdict Table

### Phase 4 location/map task list (spec §6, items 6–10)

| # | Task | Verdict | Evidence |
|---|---|---|---|
| 6 | Venue search using Overpass (with caching/fallback) | MISSING | No Overpass query in repo. `grep -rn overpass src` returns only one prose mention in `src/lib/demo/scoring-proofs.ts:227`. CSP allows `overpass-api.de` (`next.config.ts:15`) but no `fetch` ever targets it. Seeded list in `src/lib/events.ts:91-151` and `src/components/map/seed-venues.ts:22-73` is the only data source. |
| 7 | MapLibre map | DONE | `maplibre-gl@^5.24.0` in `package.json:35`. Lazy-loaded via `next/dynamic({ ssr: false })` in `src/components/map/MapView.tsx:15-18` and `await import("maplibre-gl")` only after env-gated decision in `src/components/map/MapInner.tsx:48-58`. Mitigates §11 risk register row "map bundle too heavy". |
| 8 | Price tier heuristic | PARTIAL | DB has `priceTier` enum (`src/db/schema.ts:327`). Three of the four spec tiers exist (`free`, `low`, `medium` - `$$$` missing). Tiers are hard-coded per seeded venue (`src/lib/events.ts:108,118,128,138,148`); there is no tag-based heuristic mapping Overpass `leisure=pitch / fee=yes / sport=*` → tier as spec §9 requires. |
| 9 | Price confidence labels & venue candidates UI | PARTIAL | Schema and read-path exist (`src/db/schema.ts:328`, `src/lib/chat.ts:107-108,389-390,446-447`). i18n keys exist (`messages/en/common.json:521-524`, `messages/ro/common.json:521-524`). But no UI surface renders `priceConfidence`: `EventDetailsPanel.tsx:121-138` shows only `priceTier`, `CaptainAutoEventReveal` candidate sub-line composes only `${km} · ${priceTier}` (`src/app/[locale]/events/[eventId]/page.tsx:152-170`), and `MapVenueSheet.tsx:142` shows tier only. Spec §9 also requires `captain_entered` and `unknown` confidence values - neither exists in DB enum nor lib types (`src/lib/events.ts:99` only typed as `"verified" | "estimated"`). |
| 10 | Auto-event setup (end-to-end) | PARTIAL | Captain reveal sheet renders (`src/components/event/CaptainAutoEventReveal.tsx:70-237`) and is gated on `isCaptain && status === "proposed"`. Backing `createGroupEventAction` writes event + 3 venue candidates + a vote in one tx (`src/lib/events.ts:247-355`). But "Confirm plan" only fires a toast (`CaptainAutoEventReveal.tsx:112-118`); the wired-in TODO comment at line 66 acknowledges `confirmEventAction` is missing. Vote-close handler is also a no-op (`EventScreen.tsx:256-259`). Venue selection is `SEEDED_VENUES.filter(...).slice(0,3)` - does not implement spec §8 ranking (distance 35 / sport fit 25 / weather 15 / price 10 / reliability 10 / accessibility 5). |
| (bonus) | AI Captain Brief module | DONE-ish (separate panel) | `src/lib/ai/captain-brief.ts:79-174` has fallback + Groq path with cache. `CaptainBriefPanel` component (`src/components/group/CaptainBriefPanel.tsx`) renders members + venue + time + weather. Not wired to the auto-event reveal sheet (its `reasoning` text is a hard-coded string in `src/app/[locale]/events/[eventId]/page.tsx:148-151`, not the AI brief output). |

### Cross-cutting checks

| Check | Verdict | Evidence |
|---|---|---|
| MapLibre lazy-loaded (per spec risk register) | DONE | `src/components/map/MapView.tsx:15-18` uses `dynamic(..., { ssr: false })`; `src/components/map/MapInner.tsx:51-106` defers `import("maplibre-gl")` to a client effect gated by `NEXT_PUBLIC_MAPTILER_KEY`. SVG `MapBg` fallback when no key or init fails (`MapInner.tsx:120-184`). |
| Map "denied geolocation" fallback | DONE | `src/components/map/MapPageClient.tsx:74-77` flips `geoStatus` on error; `MapPageClient.tsx:162,291-298` swaps to `MapDeniedFallback`. `MapDeniedFallback.tsx:35-162` lists venues with directions + retry button + privacy notice. |
| Privacy: rounded geolocation | DONE | `MapPageClient.tsx:68-71` rounds to ~200m before storing. Privacy notice copy in `src/app/[locale]/map/page.tsx:30-31,70-72`. |
| Deep links: Google Maps | DONE | `src/components/map/MapVenueSheet.tsx:46-49`, `MapDeniedFallback.tsx:25-28`, `EventDetailsPanel.tsx:83-86`. |
| Deep links: Apple Maps | PARTIAL | Only on `MapVenueSheet.tsx:51-54` (mobile sheet on `/map`). Missing from `EventDetailsPanel` (event page) and `MapDeniedFallback` (geolocation-denied state). |
| Deep links: Waze | PARTIAL | Only on `MapVenueSheet.tsx:56-58`. Same omission as Apple Maps. |
| Overpass query with caching | MISSING | No Overpass code; no venue cache table; `ai_cache` is unrelated. |
| Overpass fallback (cached venues + manual location) | PARTIAL-by-accident | Seeded venues alone happen to fulfil the *fallback* path (`src/lib/events.ts:91-151`) and CreateEventForm allows manual location text - but with no Overpass primary, this is the only path, not a fallback. |
| Public `/map` reads server-side | PARTIAL | `src/app/[locale]/map/page.tsx:107-119` calls `getNearbyVenuesAction` from `src/lib/venues.ts:65-165` - good. But the mapping at `src/app/[locale]/map/page.tsx:116` hard-codes `priceTier: 0` for every result, dropping the DB-stored tier. UI then shows "Free" for venues that are in fact `medium` per seed data. |
| Tests for venue ranking / price tier | MISSING | `find src -name "*.test.ts" \| xargs grep -l venue/price.tier` returns only `weather.test.ts` and `captain-brief.test.ts`. No coverage for spec §8 ranking or §9 heuristic. |
| Public map exposes only public venues | DONE | `getNearbyVenuesAction` joins `events.status IN ('proposed','confirmed')` and reads from public `venues` table; group center/radius is not surfaced (`src/lib/venues.ts:127-148`). |

## Evidence Detail

### 1. Overpass: zero implementation

```bash
$ grep -rn "overpass\|fetch.*overpass\|overpass-api" src/
src/lib/demo/scoring-proofs.ts:227:        note: "Seeded venues + Overpass cache + manual entry. Price confidence labeled.",
```

CSP allow-list permits the host (`next.config.ts:15` - `connect-src ... https://overpass-api.de`) but no client/server code constructs an Overpass QL query, hits the API, or caches results. Demo proof note is **inaccurate**.

Spec §14.8 explicitly: *"if Overpass fails, use cached venues; if no cached venues, captain enters custom location"* - the cache layer this implies does not exist as a venue cache.

### 2. MapLibre lazy load

`src/components/map/MapView.tsx:15-18`:

```ts
const MapInner = dynamic(() => import("./MapInner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => null,
});
```

`src/components/map/MapInner.tsx:48-58`:

```ts
const tileKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const wantsRealMap = Boolean(tileKey);

useEffect(() => {
  if (!wantsRealMap || !containerRef.current) return;
  // ...
  (async () => {
    try {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css").catch(() => {});
```

Two-tier defer: `dynamic` for the React component, dynamic `import()` for `maplibre-gl` itself, and the import only fires when a tile key exists. Risk register row "map bundle too heavy" is mitigated cleanly.

### 3. MapDeniedFallback + retry

`src/components/map/MapPageClient.tsx:61-87`:

```ts
const requestLocation = useCallback(() => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setGeoStatus("unsupported");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => { /* round + setUserLocation */ },
    () => { setGeoStatus("denied"); setUserLocation(null); },
    { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
  );
}, []);
```

Branch swap: `src/components/map/MapPageClient.tsx:162,291-298`:

```tsx
const showFallback = geoStatus === "denied" || geoStatus === "unsupported";
// ...
{showFallback ? (
  <MapDeniedFallback venues={filtered} onRetry={requestLocation} labels={deniedLabels} />
) : (<>...MapView...</>)}
```

`MapDeniedFallback.tsx:35-162` renders venue list + directions button + retry button + privacy line. Solid.

### 4. Price tier - hard-coded, not a heuristic

`src/lib/events.ts:91-151` is a literal fixture array:

```ts
const SEEDED_VENUES: Array<{...; priceTier: "free"|"low"|"medium"; priceConfidence: "verified"|"estimated"}> = [
  { externalId: "timisoara-roses-park", ..., priceTier: "free", priceConfidence: "verified" },
  ...
];
```

There is no function mapping OSM tags (`leisure`, `sport`, `fee`, `access`) to tiers as spec §14.9 requires. The fourth tier (`$$$` / "premium / reservation-only / padel") is absent from both the type and the data.

### 5. Price confidence: read but never rendered

DB column: `src/db/schema.ts:328`:

```ts
priceConfidence: varchar("price_confidence", { length: 20 }).notNull().default("estimated"),
```

Read path: `src/lib/chat.ts:389-390,446-447` selects and returns it. Page receives it: `src/app/[locale]/events/[eventId]/page.tsx:39` (via `venueCandidates`). But:

- `src/components/event/EventDetailsPanel.tsx:121-138` builds the venue sub-line as `${km} km · ${priceTier}` - no confidence field.
- `src/app/[locale]/events/[eventId]/page.tsx:152-170` builds reveal-sheet sub-lines from `distanceKm` + `priceTier` only.
- `src/components/map/MapVenueSheet.tsx:140-143` shows only the tier pill.
- `src/components/event/EventScreen.tsx:80,165` types `priceTier: string` but never accepts confidence.

i18n keys `event.priceConfidence.{verified,estimated}` are defined (`messages/en/common.json:521-524`, `messages/ro/common.json:521-524`) and `event.venueMeta` (`{distance} km away · {price} · {confidence}`) is defined at line 499 of both - but **`grep -rn "venueMeta\|priceConfidence\\."` in `src/` returns no matches**. Translations are dead.

Spec §14.9 also requires four confidence values (`verified`, `captain_entered`, `estimated`, `unknown`); only two exist as types.

### 6. Auto-event setup: no end-to-end confirm

`src/components/event/CaptainAutoEventReveal.tsx:60-66`:

```ts
/**
 * ...
 * The actual `confirmEventAction` is owned by the events lib agent. Until that
 * lands we surface a success toast so the demo flow stays believable; the
 * shape of the click handler will not change when it does.
 */
```

`src/components/event/CaptainAutoEventReveal.tsx:112-118`:

```ts
const onConfirm = () => {
  toast.push({ title: copy.confirmedToast, variant: "success" });
  dismiss();
};
```

The `events` row stays at status `proposed` after the captain "confirms" because no server action mutates it. Vote close is also stubbed: `src/components/event/EventScreen.tsx:256-259`:

```ts
onClose={() => {
  // Close-vote backend lives in votes.ts; this surface just emits the
  // intent. The events lib agent is wiring the close path.
}}
```

Demo proof status `"fallback"` for `auto-event-setup` (`src/lib/demo/scoring-proofs.ts:188-195`) acknowledges this honestly, but spec rubric §6 lists "auto-event setup - up to 1000p" as expecting a closed loop.

### 7. Venue ranking: not implemented

`src/lib/events.ts:280-282`:

```ts
const matchingVenues = SEEDED_VENUES.filter((venue) =>
  venue.sports.includes(group.sport as SportKey),
).slice(0, 3);
```

That is all. No distance-to-group-center weighting, no weather fit, no price weight, no reliability weight, none of spec §14.8 100-point factors. `eventVenueCandidates.distanceKm` (`src/lib/events.ts:320`) is set to `(index + 1).toFixed(2)` - a literal 1.00, 2.00, 3.00 - not a real distance.

### 8. Public map drops `priceTier`

`src/app/[locale]/map/page.tsx:107-119`:

```ts
const result = await getNearbyVenuesAction({ radiusKm: 10 });
const venues: ReadonlyArray<MapVenue> = result.ok
  ? result.data.venues.map((row) => ({
      id: row.id, name: row.name, city: row.address ?? "",
      sport: row.sport, lat: row.lat, lon: row.lng,
      priceTier: 0,                 // <-- hard-coded, ignores DB value
      eventAt: row.upcomingPublicEventCount > 0 ? new Date().toISOString() : null,
    }))
  : [];
```

`getNearbyVenuesAction` itself (`src/lib/venues.ts:90-99`) does not select `priceTier` from the venues table. So the public map cannot show real tiers. Mobile sheet always shows "Free" - `MapVenueSheet.tsx:142` reads `venue.priceTier` but the value is always `0`.

### 9. Deep links inconsistency

| Surface | Google | Apple | Waze |
|---|---|---|---|
| `MapVenueSheet` (mobile bottom sheet on `/map`) | `MapVenueSheet.tsx:46-49` | `MapVenueSheet.tsx:51-54` | `MapVenueSheet.tsx:56-58` |
| `MapDeniedFallback` (geo-denied state) | `MapDeniedFallback.tsx:25-28` | - | - |
| `EventDetailsPanel` (event page) | `EventDetailsPanel.tsx:83-86` (uses `maps.google.com/?q=` not `dir/?api=1`) | - | - |

Only one of three surfaces offers all three providers; spec lists Google + Apple + Waze as the deep-link set.

## Suggested Follow-ups (ordered by demo impact)

1. **Wire `confirmEventAction` and `closeVoteAction`** so the captain-reveal "Confirm plan" actually flips `events.status` to `confirmed` (1000p auto-event row).
2. **Render `priceConfidence`** in `EventDetailsPanel`, `CaptainAutoEventReveal` sub-lines, and `MapVenueSheet` using the existing `event.priceConfidence.*` and `event.venueMeta` translation keys.
3. **Fix the `priceTier: 0` regression** in `src/app/[locale]/map/page.tsx:116` - extend `getNearbyVenuesAction` to return `priceTier`/`priceConfidence`, then map honestly.
4. **Add `confidence: 'captain_entered' | 'unknown'`** to the type and DB enum to match spec §14.9.
5. **Extend deep links** to Apple Maps + Waze on `EventDetailsPanel` and `MapDeniedFallback`.
6. **Implement spec §14.8 venue ranking** (even a lightweight server-side sort by distance + sport-fit + weather flag) so `distanceKm` on candidates is real, not `1.00 / 2.00 / 3.00`.
7. **Either implement Overpass with caching+timeout fallback to seeded venues, or update the demo-proof note** in `src/lib/demo/scoring-proofs.ts:227` so it does not overclaim.
8. **Add unit tests** for venue ranking and price-tier heuristic per spec §14.13.
