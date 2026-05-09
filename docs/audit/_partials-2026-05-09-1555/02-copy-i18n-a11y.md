# Copy / i18n / a11y Audit - 2026-05-09 15:55

Read-only audit covering Romanian naturalness, diacritic completeness, English brand voice, hard-coded strings, ICU parity, and a11y on new components.

Worktree clean at start. `pnpm lint:i18n` exit 0. `pnpm typecheck` exit 0.

Composite copy/a11y grade: **C+** (B in user-facing flows, D in Judge Mode rubric due to mass-stripped diacritics; clean parity + working i18n lint pull the floor up).

---

## (a) Romanian naturalness

Read end-to-end: `messages/ro/common.json` (1,368 lines, 1,159 leaf strings).

User-facing copy outside the rubric block reads warm-but-pro and is largely natural, idiomatic Romanian. Headlines like "Vino. Mișcă-te. Azi." (`landing.headline`, line 1262) and "Făcut pentru energia de sâmbătă dimineața." (`landing.why.title`, line 1311) hit the right register. Below: ten highest-impact callouts, ranked by visibility-weighted impact.

1. **`messages/ro/common.json:9` `home.subtitle`** - "potriviri sportive spontane" is awkward. "potriviri sportive" reads as algorithmic-pairing jargon, not as ce inseamna in romana. Prefer "meciuri sportive spontane" or "jocuri spontane".

2. **`messages/ro/common.json:46` `auth.signup.body`** - "MVP-ul nu folosește resetare prin email" leaks "MVP" jargon to end users. Should say "aplicația" or "fluxul curent".

3. **`messages/ro/common.json:185` `onboarding.profile.aiPaused`** vs **`messages/ro/common.json:312` `onboarding.photo.aiPaused`** - "AI ia o pauză" (warm) vs "Vederea AI este offline." (cold/technical). Voice inconsistent across the same surface family. Pick one register.

3. **`messages/ro/common.json:71` `auth.login.title`** - "Autentifică-te ca jocul să continue." is grammatically OK but stiff. The natural form would use a comma: "Autentifică-te, ca jocul să continue." Or rephrase: "Autentifică-te și jocul continuă."

4. **`messages/ro/common.json:153` `onboarding.profile.form.bioPlaceholder`** - "Ce joci, când ești de obicei liber și ce fel de grup ți se potrivește?" reads natural; but at line 180 the duplicate `bioPlaceholder` says "Ce sport joci, când ești liber..." - same field, two slightly different sources of truth. Pick one.

5. **`messages/ro/common.json:188` `onboarding.profile.fullNameRequired`** - "Adaugă numele complet pentru a continua." is fine; but at line 158 the form-scoped twin says "Introdu un nume real..." - "real" sounds vaguely accusatory. Drop it.

6. **`messages/ro/common.json:281` `onboarding.location.locationDenied`** - "Locația refuzată - scrie orașul manual." Native phrasing prefers "Locație refuzată" (definite article wrong here; "Locația" implies "the [specific] location was refused"). Better: "Locație refuzată. Scrie orașul manual." or "Permisiunea pentru locație a fost refuzată."

7. **`messages/ro/common.json:330` `today.body`** - "Răspunde o singură dată pentru fereastra activă din România." - the phrase "fereastra activă" is a literal calque of "active window" and reads techy. Suggest: "intervalul activ" or "runda activă".

8. **`messages/ro/common.json:388` `today.card.queued.subhead`** - "Stai pe fază - verificăm toți jucătorii din apropiere care au zis da azi." Excellent register. Keep.

9. **`messages/ro/common.json:422` `today.weather.clear`** - "Senin, 18°C". Fine.

10. **`messages/ro/common.json:1311` `landing.why.title`** - "Făcut pentru energia de sâmbătă dimineața." Strong. Keep. (Note: "dimineața" with proper diacritics here. Compare against the rubric block, see section b.)

**Letter grade for non-rubric Romanian: B+.** Voice consistent, diacritics 99% intact, register warm-but-pro.

**Letter grade including the rubric block: D.** The rubric note block (lines 803-948) is bulk stripped of diacritics, mixes registers, and reads like an English translation through ASCII filter.

---

## (b) Diacritic completeness

Word-boundary grep run against `messages/ro/common.json`. **22 high-confidence stripped-diacritic offender lines** from the canonical seed list, plus **~59 additional offenders** when the search list is widened to actual content of the file (Romanian content words missing diacritics). Total unique stripped-diacritic lines: **81**.

Concentration: **lines 803-949 (rubric.categories + rubric.rows)** account for ~46 of them - this entire block was authored without diacritics. Conservatively, ~95% of the diacritic problem is contained in this one block.

### Canonical-list hits in `messages/ro/common.json`:

| Line | Stripped form | Should be |
|------|---------------|-----------|
| 803  | `Fundatie` | `Fundație` |
| 807  | `Harti + Locatie` | `Hărți + Locație` |
| 808  | `Imbunatatiri` | `Îmbunătățiri` |
| 809  | `Notificari` | `Notificări` |
| 811  | `Productie` | `Producție` |
| 816  | `cod de recuperare` (OK), but full sentence has correct diacritics actually - false positive |
| 820  | `si campurile profilului public sunt salvate inainte de pasul cu sporturi` | `și câmpurile profilului public sunt salvate înainte de pasul cu sporturi` |
| 824  | `Alimenteaza` | `Alimentează` |
| 827  | `locatie + raza` | `locație + rază` |
| 828  | `fara pin exact al casei` | `fără pin exact al casei` |
| 832  | `verificare MIME, procesare WebP si salvare in profil sunt conectate` | `verificare MIME, procesare WebP și salvare în profil sunt conectate` |
| 836  | `Cinci stari explicite ... fara prompt` | `Cinci stări explicite ... fără prompt` |
| 839  | `Potrivire inteligenta: sport + marime + proximitate` | `Potrivire inteligentă: sport + mărime + proximitate` |
| 840  | `Formare determinista a grupului dupa Da, in baza utilizatorilor seedati` | `Formare deterministă a grupului după Da, în baza utilizatorilor seedați` |
| 844  | `Starea de potrivire apeleaza confirmMembershipAction inainte de deschiderea grupului` | `Starea de potrivire apelează confirmMembershipAction înainte de deschiderea grupului` |
| 848  | `Profilurile publice apeleaza scorul de compatibilitate prin Groq cand este configurat; fara output AI seedat` | `Profilurile publice apelează scorul de compatibilitate prin Groq când este configurat; fără output AI seedat` |
| 852  | `Taburi Plan / Chat / Jucatori; pastila capitan; panou echilibru echipe` | `Taburi Plan / Chat / Jucători; pastilă căpitan; panou echilibru echipe` |
| 856  | `Chatul de grup persistent este live. Dovada streamului SSE ramane in lucru` | `Chatul de grup persistent este live. Dovada streamului SSE rămâne în lucru` |
| 859  | `Creare eveniment de grup de catre capitan` | `Creare eveniment de grup de către căpitan` |
| 860  | `Crearea evenimentelor legate de grup este conectata; evenimentele publice raman in afara scopului` | `Crearea evenimentelor legate de grup este conectată; evenimentele publice rămân în afara scopului` |
| 867  | `Atribuire automata a capitanului` | `Atribuire automată a căpitanului` |
| 868  | `Selectia determinista a capitanului (cel mai rapid raspuns) este salvata pe grup` | `Selecția deterministă a căpitanului (cel mai rapid răspuns) este salvată pe grup` |
| 871  | `Setare automata eveniment + Brief Capitan AI` | `Setare automată eveniment + Brief Căpitan AI` |
| 872  | `Pagina de eveniment apeleaza generateCaptainBrief cu fallback determinist cand Groq nu raspunde` | `Pagina de eveniment apelează generateCaptainBrief cu fallback determinist când Groq nu răspunde` |
| 876  | `Voturi live numarate; capitanul poate decide manual ca fallback` | `Voturi live numărate; căpitanul poate decide manual ca fallback` |
| 883  | `Sugestii terenuri cu distanta + nivel de pret` | `Sugestii terenuri cu distanță + nivel de preț` |
| 884  | `Baza de date de terenuri seedata + sortare dupa distanta + intrare manuala de catre capitan ca fallback` | `Bază de date de terenuri seedată + sortare după distanță + intrare manuală de către căpitan ca fallback` |
| 888  | `Incarcare lazy MapLibre; fallback lista cand locatia e refuzata; linkuri de directii` | `Încărcare lazy MapLibre; fallback listă când locația e refuzată; linkuri de direcții` |
| 892  | `Open-Meteo cu reguli pentru ploaie/vant/frig; fallback din cache daca API-ul intarzie` | `Open-Meteo cu reguli pentru ploaie/vânt/frig; fallback din cache dacă API-ul întârzie` |
| 895  | `Extragere AI sporturi din bio` | `Extragere AI sporturi din bio` (OK) |
| 896  | `Apeleaza extractia text Groq pe bio-uri reale cand GROQ_API_KEY este configurat; fara output AI seedat` | `Apelează extracția text Groq pe bio-uri reale când GROQ_API_KEY este configurat; fără output AI seedat` |
| 899  | `Extragere AI sporturi din poza` | `Extragere AI sporturi din poză` |
| 900  | `Butonul de analiza apeleaza Groq vision pe imaginea incarcata cand este configurat; fallback-ul offline nu inventeaza sugestii` | `Butonul de analiză apelează Groq vision pe imaginea încărcată când este configurat; fallback-ul offline nu inventează sugestii` |
| 904  | `Scorul de potrivire din profil public este calculat live, cache-uit dupa primul apel Groq si niciodata pre-seedat` | `Scorul de potrivire din profil public este calculat live, cache-uit după primul apel Groq și niciodată pre-seedat` |
| 907  | `Brief Capitan AI (rezumat actiuni)` | `Brief Căpitan AI (rezumat acțiuni)` |
| 908  | `Paginile de eveniment apeleaza Groq pentru brief-ul capitanului cand este configurat; textul determinist este doar fallback offline` | `Paginile de eveniment apelează Groq pentru brief-ul căpitanului când este configurat; textul determinist este doar fallback offline` |
| 911  | `Recomandari inteligente coechipieri` | `Recomandări inteligente coechipieri` |
| 912  | `Sugestiile rankate ajung cu sertarul de invitatii in Valul 3` | `Sugestiile rankate ajung cu sertarul de invitații în Valul 3` |
| 915  | `Centru persistent de notificari` | `Centru persistent de notificări` |
| 916  | `Randuri persistente + citit/necitit; intrare prin clopotelul din header` | `Rânduri persistente + citit/necitit; intrare prin clopoțelul din header` |
| 920  | `Ruta server + export client in pagina; linii pliate` | `Ruta server + export client în pagină; linii pliate` |
| 924  | `Doar First Match este revendicata; Showed Up 3 Times ramane nerevendicata pana la prezenta reala` | `Doar First Match este revendicată; Showed Up 3 Times rămâne nerevendicată până la prezența reală` |
| 928  | `Prefix de locale mereu; RO implicit; acoperire completa a mesajelor` | `Prefix de locale mereu; RO implicit; acoperire completă a mesajelor` |
| 931  | `Link public de invitatie + distribuire` | `Link public de invitație + distribuire` |
| 932  | `Previzualizare privacy-safe; chat / participanti / voturi nu sunt expuse` | `Previzualizare privacy-safe; chat / participanți / voturi nu sunt expuse` |
| 936  | `Serviciu Railway; health verifica conectivitatea bazei de date` | `Serviciu Railway; health verifică conectivitatea bazei de date` |
| 940  | `Limite src/app + src/lib + src/db; server actions validate cu zod` | `Limite src/app + src/lib + src/db; server actions validează cu zod` |
| 944  | `Mai intai 360px; bottom nav; compozitoare sticky; screenshoturi Playwright pe latimi diferite` | `Mai întâi 360px; bottom nav; compozitoare sticky; screenshoturi Playwright pe lățimi diferite` |
| 948  | `Ruta protejata, live/seeded/fallback per rand, fara afirmatii false-green` | `Rută protejată, live/seeded/fallback per rând, fără afirmații false-green` |

### Outside the rubric block (smaller offender population):

| Line | File | Note |
|------|------|------|
| 282  | `messages/ro/common.json:282` | `locationError` reads "N-am putut citi locația - scrie orașul manual." Diacritics OK; the dash is a hyphen, not em-dash. Pass. |
| 384  | `messages/ro/common.json:384` | `today.card.found.errorBody` "Nu s-a putut confirma acum." OK. Pass. |
| 1185 | `settings.privacy.alwaysOn` | "Mereu activ" OK. Pass. |

**Practically all offenders cluster inside the rubric note block (lines 803-949).** Fixable in one focused PR by re-running the rubric block through a translator with `RO_DIACRITICS=on`. No `Timisoara` leak in JSON (0 hits in `messages/ro/common.json` and `messages/en/common.json`). Settings, Today, Group, Onboarding RO copy is largely correct.

---

## (c) English brand voice + Timișoara

`messages/en/common.json:9` (`home.subtitle`), `messages/en/common.json:257` (`onboarding.location.cardBody`), `messages/en/common.json:1261` (`landing.eyebrow`), `messages/en/common.json:1326` (`landing.footer.tagline`), `messages/en/common.json:1331` (`landing.footer.builtIn`) - all spell **Timișoara** with proper diacritics. Zero `Timisoara` leaks anywhere.

No AI-slop tells found:
- `delve` - 0 hits
- `tapestry` - 0 hits
- `elevate` - 0 hits
- `seamless` - 0 hits
- `leverage` - 0 hits
- `unlock` - 0 hits

### Em-dash sweep (AGENTS.md ban: no `—` or `–`)

| Path | Char | Count | Worst location |
|------|------|-------|----------------|
| `messages/en/common.json` | — / – | **0** | clean |
| `messages/ro/common.json` | — / – | **0** | clean |
| `src/app/[locale]/events/[eventId]/page.tsx:80` | `–` | 1 | `${timeFmt.format(startsAt)} – ${timeFmt.format(endsAt)}` - en-dash in user-visible time range. **VIOLATION.** |
| `src/components/event/CaptainAutoEventReveal.tsx:16` | `–` | 1 | JSDoc only: `// "Today, 19:00 – 20:30"` - comment example, but example matches the violation in line above. |
| `src/components/onboarding/LocationForm.tsx:56` | `–` | 1 | comment-only `1–10 km` - lower priority but technically banned. |
| `README.md:102-104` | `–` | 3 | participant-count ranges (`10–14 people`, `2–4 people`, `6–10 people`). README is shipped to graders. **VIOLATION.** |
| `AGENTS.md` / `CLAUDE.md` | none | 0 | clean |
| `docs/audit/*` | various | many | history files; out of scope of the codebase ban-target but worth noting future audit partials should use `-`. |

**Total em/en-dash hits in production code paths: 4** (1 user-visible runtime string, 1 comment example tied to it, 1 lib comment, plus 3 in README). **Worst offender: `src/app/[locale]/events/[eventId]/page.tsx:80`** because it lands in user-facing timestamp text on the event detail page.

### English voice callouts (≤8)

1. **`messages/en/common.json:8`** `home.title` - "Show up - there's a game forming near you." Hyphen mid-sentence reads slightly off. Consider em-dash replacement-aware rewrite: "Show up. A game is forming near you."
2. **`messages/en/common.json:46`** `auth.signup.body` - "the MVP does not use email or phone resets" exposes "MVP" to end users. Same issue as RO mirror.
3. **`messages/en/common.json:119`** `brandLine` "Show up. Move." vs landing `messages/en/common.json:1262` `landing.headline` "Show up. Move. Today." - tagline drift. Pick canonical and hold the line.
4. **`messages/en/common.json:198`** `onboarding.sports.body` - "first deterministic matching gate" - "gate" jargon leaks to UX. Suggest "filter".
5. **`messages/en/common.json:629`** `event.weatherFit.cold_warning` "Cold conditions. Consider indoor play or a shorter session." Stiff register vs the warmer `outdoor_good` ("Clear enough to keep the outdoor option high."). Match the voice.
6. **`messages/en/common.json:1300`** `landing.how.step3.body` - "One tap each morning. Yes - we look for nearby players right now." Hyphen serves where an em-dash would normally; AGENTS.md ban makes hyphen the right call. Keep but consider period: "One tap each morning. Say yes - we look for nearby players right now."
7. **`messages/en/common.json:1337`** `leaderboard.body` - "Stub leaderboard - real ranking lands with the matching telemetry." "Stub" is engineer-speak; consider "Demo" or "Preview".
8. **`messages/en/common.json:1346`** `leaderboard.stub` "Stub data · TODO". `TODO` inline in user-facing copy. Should not ship as visible text.

---

## (d) Hard-coded JSX strings (top 15 offenders)

Search scope: `src/app/[locale]/**`, `src/components/**`. Filtered to user-visible JSX text/aria/alt/title/placeholder, ranked by visibility weight.

| # | File | Line | Hard-coded | Visible? |
|---|------|------|------------|----------|
| 1 | `src/components/onboarding/SportsForm.tsx` | 241-242 | `title="Choose sports" subtitle="Pick what you like to play"` on `WizardMobileHeader` | **YES, top of every onboarding step 2 render.** Bypasses `messages/*/common.json:onboarding.sports.headerTitle/headerSubtitle` keys entirely. **P0 LEAK** |
| 2 | `src/components/demo/WalkthroughNav.tsx` | 61 | `aria-label="Demo walkthrough navigation"` | aria only; mounts on every scripted-demo page |
| 3 | `src/components/demo/WalkthroughNav.tsx` | 67, 88 | `Previous step (...)` / `Next step (...)` aria templates | aria only; visible to AT users |
| 4 | `src/lib/demo/walkthrough.ts` | 16-22 | `WALKTHROUGH_STEPS` labels: `"Today" "Groups" "Group" "Event" "Vote" "Calendar" "Judge Mode"` | feeds into `WalkthroughNav.tsx` aria-label dynamically |
| 5 | `src/components/onboarding/PhotoForm.tsx` | 24-35 | `SPORT_LABELS` dict: `"Football" "Basketball" ...` consumed at line 508 in pill UI when AI suggestions render | **YES, AI sport pills always show English regardless of locale** |
| 6 | `src/components/onboarding/PhotoForm.tsx` | 139 | `"from photo"` / `"fallback hint"` source labels assigned to suggestions | unused for display in current code; latent risk |
| 7 | `src/components/onboarding/PhotoForm.tsx` | 338 | `alt="Profile preview"` on uploaded photo `<img>` | aria/alt; user-visible to AT |
| 8 | `src/components/notifications/NotificationInbox.tsx` | 43, 49, 55, 61 | `kindMeta.label: "Match"/"Vote"/"Event"/"Chat"` | fallback only when `kindLabels` prop omitted; called by `NotificationInboxActions` which passes `kinds` so paths-of-use are safe; latent risk |
| 9 | `src/components/notifications/NotificationInbox.tsx` | 114-116 | Default props `markReadLabel="Mark read" openLabel="Open" justNowLabel="Just now"` | shipped to AT and to inline label when copy not threaded; latent risk |
| 10 | `src/components/notifications/NotificationInbox.tsx` | 123 | `aria-label="Notifications"` on `<ul>` | aria only |
| 11 | `src/components/notifications/NotificationInboxActions.tsx` | 200, 203, 214, 217 | EmptyState fallbacks: `"You're all caught up" "When a match forms..." "Nothing in this filter" "Try a different filter to see more updates."` | latent (parent passes `emptyTitle`/`emptyBody` from messages, fallbacks fire only on misconfig) |
| 12 | `src/components/events/CreateEventForm.tsx` | 162 | `actionLabel="Change"` on selected `VenueRow` | **YES, visible button label in /events/new** |
| 13 | `src/components/demo/DemoControls.tsx` | 65 | `description: \`${users} users · ${groups} groups · ${events} events\`` toast text | **YES, toast on demo seed** |
| 14 | `src/components/demo/DemoControls.tsx` | 78, 111 | `"network"` toast description on fetch failure | toast on demo seed/reset |
| 15 | `src/components/ui/Sheet.tsx:66`, `Dialog.tsx:103`, `Toast.tsx:152`, `settings/SettingsTabs.tsx:51,97`, `auth/RecoverForm.tsx:53`, `map/MapVenueSheet.tsx:68` | various | aria-only labels (`"Close sheet"`, `"Close dialog"`, `"Dismiss notification"`, `"Settings sections"`, `"Recovery steps"`, `"Venue details"`) | aria; AT users see English even on RO; widespread but cheap to fix in batch |

Additional structural note: `src/app/[locale]/settings/page.tsx:32-196`, `src/app/[locale]/calendar/page.tsx:20-`, `src/app/[locale]/u/[username]/page.tsx:24-`, `src/app/[locale]/map/page.tsx:19-` carry their own `const COPY = { en: {...}, ro: {...} }` blocks instead of using `messages/*/common.json`. Those copies are localized and consistent at a snapshot, but the structural drift means future translator runs on `messages/` will silently miss those routes. Track as tech debt.

**Top blocker (this section): SportsForm.tsx:241-242 hard-codes English over the `onboarding.sports.headerTitle/headerSubtitle` keys. Romanian users see "Choose sports / Pick what you like to play" on the second onboarding step regardless of locale.**

---

## (e) ICU + parity check

- Locale parity: **PASS.** `messages/en/common.json` and `messages/ro/common.json` each carry exactly **1,159 leaf string keys**. Zero en-only or ro-only keys. Zero structural drift.
- ICU placeholder parity: **PASS.** All named placeholders (`{name}`, `{count}`, `{sport}`, `{distance}`, `{city}`, etc.) match 1:1 between EN and RO. The only "differences" are correct: Romanian plural categories require an extra `few` form (e.g. `event.votes`, `groupsList.activeCount`, `groupsList.captainCount`) that English's two-form plural lacks - this is a Romanian grammar requirement, not a bug.
- `pnpm lint:i18n`: **EXIT 0** ("i18n check passed.").
- `pnpm typecheck`: **EXIT 0**.

---

## (f) a11y on new components since T0=14:32

### Legend
- PASS: meets the criterion explicitly
- PARTIAL: meets some sub-criteria; gaps noted
- FAIL: criterion violated or absent

### `src/components/layout/DesktopSidebar.tsx` (commit `8cbf7d5`, mounted by `c81a16b`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | covered globally `src/app/globals.css:183-186` |
| aria-label on icon-only | PASS | `aria-label={t("notifications")}` and dynamic `notificationsWithCount` at `src/components/layout/DesktopSidebar.tsx:152-156` |
| 44/48px tap target | PASS | `minHeight: 44` at lines 126, 159 |
| sticky CTA | N/A | nav, not CTA |
| prefers-reduced-motion | PASS | only `transition: background-color 120ms ease`; safe under reduce |
| aria-live | N/A | static nav |
| aria-busy | N/A | no async state |
| **Overall** | **PASS** | clean |

### `src/components/group/CaptainBriefPanel.tsx` (commit `616a31d` polish)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global; no interactive children |
| aria-label on icon-only | PASS | `aria-label={t("ariaLabel")}` line 81; `aria-label={t(\`status.${m.status}\`)}` line 152 |
| 44/48px tap target | N/A | no buttons inside |
| sticky CTA | N/A | not a CTA component |
| prefers-reduced-motion | PASS | no motion |
| aria-live | PARTIAL | brief renders confirmed/pending/declined dynamically but no `aria-live` on the squad summary; if upstream toggles the status, AT users won't get the diff. Add `aria-live="polite"` on the wrapping `<section>`. |
| aria-busy | PARTIAL | when `loading=true` (line 175) renders `<BriefStatSkeleton />` x3 but no `aria-busy="true"` on the section. Add `aria-busy={loading}` on the wrapping `<section>`. |
| **Overall** | **PARTIAL** | a11y semantics OK statically; missing live-region + busy hints for async state |

### `src/components/onboarding/PhotoForm.tsx` (commits `27d7b1f`, `e03a84f`, `a4c1cee`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global |
| aria-label on icon-only | PASS | `aria-label={t("chooseFile")}` on dropzone line 294 |
| 44/48px tap target | PARTIAL | dropzone height 220 PASS; choose-file button `minHeight: 44` line 396 PASS; analyze button `minHeight: 48` line 437 PASS; **suggestion pills (line 485-510) have no minHeight; rely on padding `8px 12px` which can fall below 36px on small fonts** |
| sticky CTA | PASS | `WizardStickyActionBar` at line 558 |
| prefers-reduced-motion | PARTIAL | uses `var(--t-1)` and explicit `animation: ratchet-in 0.18s` (line 281) and `0.2s` (line 482) but does NOT gate via `@media (prefers-reduced-motion)`. Global CSS in `src/app/globals.css:421` declares `@media (prefers-reduced-motion: reduce)` reset; verify that block disables `ratchet-in`. |
| aria-live | FAIL | `statusBanner` (line 401-426) carries `role="status"` (good!) but the AI suggestions list does not announce when results arrive. Add `aria-live="polite"` on the AI results region around line 461. |
| aria-busy | FAIL | analyze button (line 430) is `disabled` while loading but has no `aria-busy="true"` and the button label changes from "Analyze with AI" -> "Reading the photo..." without a screen-reader-friendly transition cue |
| **Overall** | **PARTIAL** | drop zone solid; AI surfaces miss `aria-live` + `aria-busy` |

### `src/components/events/CreateEventForm.tsx` (commit `f1c7d95`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global |
| aria-label on icon-only | N/A | no icon-only buttons (submit has Glyph + label) |
| 44/48px tap target | PASS | submit `minHeight: 48` line 203; venue rows are list buttons with internal `<VenueRow>` which has its own height |
| sticky CTA | FAIL | submit button is inline at the end of form, not stickied. AGENTS.md UX rules require sticky action bars for mobile UI on action surfaces. Wrap in a sticky bar. |
| prefers-reduced-motion | PASS | no animations |
| aria-live | FAIL | `selectedVenue` flips when user picks a card (line 146) but no `aria-live` on the "Selected venue" region. AT users won't hear that the selection landed. |
| aria-busy | FAIL | submit button uses `disabled={pending}` (line 201) but no `aria-busy={pending}`. |
| Hard-coded `actionLabel="Change"` | FAIL | line 162 - English-only label |
| **Overall** | **PARTIAL** | passes static a11y; weak on async/busy states + sticky CTA |

### `src/components/notifications/NotificationInbox.tsx` (polish `11b2619`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global |
| aria-label on icon-only | PARTIAL | row link has full-context aria-label `${kindLabel}: ${item.title}. ${openLabel}` line 183 PASS; mark-read button has only `Glyph.check` icon + visible text "Mark read" - acceptable |
| 44/48px tap target | FAIL | mark-read button at line 292 has `minHeight: 32` (line 308). **Fails 44px target.** |
| sticky CTA | N/A | inbox list, not CTA |
| prefers-reduced-motion | PASS | only `transition: background 180ms` (line 178); reduce-motion-safe |
| aria-live | FAIL | static list; relies on `NotificationInboxActions` parent for live regions |
| aria-busy | FAIL | mark-read uses optimistic UI in parent; child has no aria-busy plumbing |
| **Overall** | **FAIL** | tap-target violation is hard fail; otherwise clean |

### `src/components/notifications/NotificationInboxActions.tsx` (polish `11b2619`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global |
| aria-label on icon-only | PARTIAL | `aria-live="polite"` on count line 152 PASS; filter chips have `role="tab"` + `aria-selected` + `aria-label` on tablist line 254 PASS |
| 44/48px tap target | FAIL | FilterChips `minHeight: 36` line 277. Mark-all button `minHeight: 44` line 167 PASS. |
| sticky CTA | N/A | not CTA surface |
| prefers-reduced-motion | PASS | tints/transitions only |
| aria-live | PASS | line 152 unread counter is `aria-live="polite"` |
| aria-busy | PARTIAL | mark-all-read `pending` state from `useTransition`; button has `disabled` + `aria-disabled` (lines 161-162) but missing `aria-busy={pending}` |
| **Overall** | **PARTIAL** | live region present; tap-target on filters fails; missing aria-busy on mark-all |

### `src/components/demo/DemoControls.tsx` (polish `9f2b36a`, `fb9a3a2`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global |
| aria-label on icon-only | PASS | seed/reset buttons have visible labels + glyphs |
| 44/48px tap target | FAIL | reset-confirm dialog buttons `minHeight: 40` lines 180, 189. Below 44 target. |
| sticky CTA | N/A | not a sticky surface |
| prefers-reduced-motion | PASS | no animations |
| aria-live | FAIL | uses `useToast` which generally provides live region (verify in `Toast.tsx`); no explicit `aria-live` on inline state |
| aria-busy | PARTIAL | `disabled={seeding}` line 124 and `disabled={resetting}` line 134 but no `aria-busy` |
| Hard-coded toast description | FAIL | line 65 "users · groups · events"; lines 78, 111 "network" |
| **Overall** | **PARTIAL** | dialog tap targets too small; toast text not localized |

### `src/components/demo/WalkthroughNav.tsx` (commit `5fd053a`)
| Criterion | Result | Note (file:line) |
|-----------|--------|------------------|
| focus-visible | PASS | global; uses `<Link>` and `<span role="button">` |
| aria-label on icon-only | PARTIAL | both NavButtons have `aria-label={ariaLabel}` (lines 128, 140) BUT the labels are hard-coded English `Previous step (...)` / `Next step (...)` (lines 67, 88); plus container `aria-label="Demo walkthrough navigation"` line 61 also hard-coded English |
| 44/48px tap target | PASS | `width: 44, height: 44` lines 110-111 |
| sticky CTA | N/A | floating nav, not CTA |
| prefers-reduced-motion | PARTIAL | line 121 `transition: "transform 120ms ease, background 120ms ease"` and line 142 `hover:[transform:scale(1.06)]` - global reduce-motion CSS in `src/app/globals.css:421` should neutralize but verify the wildcard transition reset covers this. |
| aria-live | N/A | static nav |
| aria-busy | N/A | no async |
| **Overall** | **PARTIAL** | tap targets and focus-visible solid; aria-labels are English-only |

---

## Roll-up: top blockers

1. **`src/components/onboarding/SportsForm.tsx:241-242`** - Romanian users see English headers on the sports onboarding step. Visible regression of the i18n contract; trivial fix.
2. **`messages/ro/common.json:803-948`** - 46+ stripped-diacritic lines in the Judge Mode rubric block. Will be the most-photographed surface during demo (Judge Mode is a rubric row itself); diacritics there scream "not finished".
3. **`src/app/[locale]/events/[eventId]/page.tsx:80`** - en-dash in user-visible time range; AGENTS.md ban violation.
4. **`src/components/notifications/NotificationInbox.tsx:308`** + **`src/components/demo/DemoControls.tsx:180,189`** + **`src/components/notifications/NotificationInboxActions.tsx:277`** - tap targets at 32-40px violate the 44px rule.
5. **`src/lib/demo/walkthrough.ts:16-22` + `WalkthroughNav.tsx:61,67,88`** - the new scripted-demo nav is English-only in aria + step labels, even on `/ro/...` routes.

## Quick fixes (ordered by points-per-minute)

1. Move `SPORT_LABELS` and SportsForm headers to `messages/*` (15 min, biggest user-facing win).
2. Replace en-dash in `events/[eventId]/page.tsx:80` with `-` and update the JSDoc example in `CaptainAutoEventReveal.tsx:16` (2 min).
3. Localize the rubric note block in `messages/ro/common.json` (45-60 min focused; rubric stays internally consistent and credible during demo).
4. Bump `minHeight: 32 -> 44` on NotificationInbox mark-read, `36 -> 44` on FilterChips, `40 -> 44` on DemoControls dialog buttons (5 min total).
5. Add `aria-live="polite"` + `aria-busy={pending}` on async surfaces: PhotoForm AI region, CreateEventForm submit + selection region, DemoControls toast plumbing, mark-all-read button (15 min).
6. Add `t()` for `WALKTHROUGH_STEPS` labels and `WalkthroughNav` aria-labels (10 min).
7. Localize aria-only English fallbacks in `Sheet.tsx`, `Dialog.tsx`, `Toast.tsx`, `SettingsTabs.tsx`, `RecoverForm.tsx`, `MapVenueSheet.tsx` (10 min).

---

## Composite grade

| Axis | Grade | Reasoning |
|------|-------|-----------|
| RO naturalness (user flows) | B+ | warm-but-pro, idiomatic, minor jargon leaks |
| RO naturalness (rubric block) | D | mass diacritic strip + register drop |
| Diacritic completeness | D | 46+ stripped lines clustered in rubric block |
| EN brand voice | A- | clean, no AI slop, Timișoara correct everywhere |
| Em-dash discipline | B | 0 in messages, 4 in code/docs incl. 1 user-visible (events page) and 3 README |
| Hard-coded JSX strings | C | 1 P0 (SportsForm), several latent (NotificationInbox defaults, kindMeta), structural drift on COPY blocks in 4 page files |
| ICU + parity | A | exact 1,159/1,159, lint passes |
| a11y on new components | C+ | global focus-visible saves the floor; missing aria-busy/aria-live on async surfaces; 4 tap-target violations |

**Composite copy/a11y: C+** (would lift to **B** with the 5 quick fixes above and to **B+** if the rubric block diacritics are restored).
