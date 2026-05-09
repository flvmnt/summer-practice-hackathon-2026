# 05 — Phase 4: AI Features Audit (Groq)

Audit date: 2026-05-09 14:32
Specs: `docs/specs/12-implementation-plan.md` §6 (Phase 4), `docs/specs/05-ai-features.md` (full)
Cross-ref: `docs/audit/_partials-2026-05-09-1423/03-ai-wiring.md` (prior wiring audit; consistent with this report)

## Headline

Phase 4 AI is **PARTIAL**. The lib layer is solid: Groq wrapper, `ai_cache` table, deterministic fallbacks, and zod-validated structured output all exist with unit tests. But three of the five Groq features are **DEAD CODE**: bio-extract, captain-brief, and the `extractSportsForCurrentUserAction` server action have **zero callers in the UI**. Onboarding and group/event UIs use **client-side local stubs** instead of the real Groq actions. Photo→sports vision is **not implemented at all** (vision model defined, never called). Smart teammate recommendations are **MISSING** entirely. Only AI compatibility scoring is wired (public profile match%), and even that hides the AI-generated `reason` text. Net: ~1,500–2,000p of Groq-eligible rubric points are unclaimed despite the lib code being production-ready.

## Verdict Table

### Phase 4 AI tasks (spec §6, items 1–5 + 11; venues/maps belong to next agent)

| # | Phase 4 task | Verdict | Evidence |
|---|---|---|---|
| 1 | Groq wrapper | DONE | `src/lib/groq.ts:1-113` — `isGroqConfigured`, `getTextModel`, `getVisionModel`, `chatCompletion`, `chatJson`, `GroqError`; env-driven model IDs; jsonMode + zod parse + repair-on-fail |
| 2 | Bio sport extraction | PARTIAL | Lib + server action shipped but **no UI caller**; onboarding `ProfileForm` uses local stub instead. See evidence §1. |
| 3 | Photo sport extraction | MISSING | Vision model exported but unused; `PhotoForm` uses hardcoded `localPhotoAnalyze()` stub; no `photo-extract.ts` lib, no server action. See evidence §3. |
| 4 | AI compatibility explanations | PARTIAL | `scoreCompatibility()` wired into public profile match %, but UI hides the AI `reason` text and shows empty breakdown rows. See evidence §2. |
| 5 | Teammate recommendations | MISSING | No recommendations lib/file; no "best fit today", "nearby", "good captain", "balances teams" surfaces. Demo proof row marked `pending`. See evidence §5. |
| 11 | AI Captain Brief + cached AI fallbacks | PARTIAL | `generateCaptainBrief()` shipped + tested; **zero callers**. The `CaptainBriefPanel` UI exists but renders static, deterministic data — no AI text path. Cache layer fully wired by all three lib helpers. See evidence §4. |

### Cross-cutting infrastructure

| Area | Verdict | Evidence |
|---|---|---|
| `ai_cache` table | DONE | `src/db/schema.ts:482-486`; migration `drizzle/0007_cultured_kree.sql` |
| Cache helper used by every Groq call | DONE | `src/lib/ai/cache.ts:22-59` `getOrCompute`; called from `bio-extract.ts:64`, `compat-score.ts:208`, `captain-brief.ts:136` |
| Demo seed preloads `ai_cache` rows (per spec §2) | MISSING | `scripts/seed-demo.ts` and `scripts/seed.ts` write zero rows to `ai_cache`; demo UI counts entries (`src/app/[locale]/demo/page.tsx:78`) but seeds none |
| Deterministic fallback for every Groq feature | DONE-where-implemented | bio: `extractSportsByKeyword` (`bio-extract.ts:32-51`); compat: `scoreCompatibilityDeterministic` (`compat-score.ts:113-179`); brief: `buildFallbackCaptainBrief` (`captain-brief.ts:79-105`); photo: not implemented (no fallback path because no AI path) |
| `GROQ_API_KEY` / models in env | DONE | `.env.example:13-15`; `.env.local:1-3` populated with real key + both model IDs |
| Prompt-injection / privacy guardrails (spec §9) | DONE | All three system prompts: model instructions precede user content, user content delimited, output zod-validated, unsupported sports dropped (`bio-extract.ts:82`, `compat-score.ts:48`, `captain-brief.ts:48-49`); no logging of bio/photo/PII observed in any AI module |
| Health surface shows configured model IDs (spec §1) | MISSING | `src/lib/health.ts` returns `process` + `db` only; no Groq config probe or model echo |

---

## Evidence

### 1. Bio sport extraction — PARTIAL (dead server action, UI uses stub)

**Lib (good):** `src/lib/ai/bio-extract.ts`
- `extractSportsByKeyword(bio)` — deterministic fallback, lines 32–51, uses `SPORT_KEYWORDS` dict with diacritic normalize (Romanian + English).
- `extractSportsFromBio(bio)` — AI + fallback orchestrator, lines 53–95.
  - Checks `isGroqConfigured()` (line 61) before Groq call.
  - Uses `getOrCompute(["bio-extract", "bio-v1", model, trimmed], 24h, ...)` — cache key includes prompt version + model + bio (lines 64–79).
  - Calls `chatJson(model, [system, user], bioExtractionSchema, {temperature:0, maxTokens:800})` (lines 68–76).
  - Filters confidence ≥ 0.35, max 5, sorted desc (lines 81–84).
  - On any throw → returns `{suggestions: extractSportsByKeyword(...), source: "fallback"}` (lines 89–94).
- Schema in `src/lib/contracts/ai.ts` (`bioExtractionSchema`); unit tests in `src/lib/ai/bio-extract.test.ts:1-69` (8 cases incl. Romanian diacritics, ping-pong, caps-at-5, no false-match on "Brunch on Sundays").

**Server action (good but orphaned):** `src/lib/ai-actions.ts:15-28`
- `extractSportsForCurrentUserAction()` — auth-checks via `getCurrentUser()`, trims bio, returns `{ok, suggestions, source}`.
- **Callers in codebase: ZERO.** `grep -rn extractSportsForCurrentUserAction src/` → only the definition itself.

**UI (broken — uses stub):** `src/components/onboarding/ProfileForm.tsx:50-85`
- `localBioSuggest(bio)` is a **client-side regex stub** — duplicates the keyword fallback logic in the browser, never calls Groq.
- Comment at line 51–54 admits the divergence: *"Wave 1 has no `bioSuggestSportsAction` server action yet (verified — no AI/Groq files exist in src/lib). … Real Groq wiring lands in a later wave."* — comment is stale; the server action and lib both exist now.
- `handleSuggest()` (line 130) calls the stub via `setTimeout(..., 480)` instead of `extractSportsForCurrentUserAction()`.

**Verdict source:** `src/lib/demo/scoring-proofs.ts:254-261` — claims `status: "fallback"` for the 500p row. Honest given current wiring (no AI path runs end-to-end), but the lib is one wiring change away from `live`.

---

### 2. AI compatibility explanations — PARTIAL (wired but reason hidden)

**Lib (good):** `src/lib/ai/compat-score.ts`
- `scoreCompatibilityDeterministic(a, b)` — always-works deterministic score, lines 113–179. Weights match spec §5 table (sport 30 / distance 20 / availability 20 / group-size 10 / skill 10 / AI 10).
- `scoreCompatibility(a, b)` — orchestrator, lines 192–262.
  - Always computes deterministic first (line 196), returns it as fallback if `!isGroqConfigured()` (line 198).
  - Cache key sorted by user id so `(a,b) == (b,a)` (lines 203–215).
  - Cache via `getOrCompute(["compat-score","compat-v1",model,fingerprint(a),fingerprint(b)], 24h, ...)` (lines 208–246).
  - Defensive: trusts deterministic `sharedSports` / `proximityFit` / `skillFit` over AI output, keeps AI `score` + `reason` only (lines 250–258).
  - On error → `{...deterministic, source:"fallback"}` (line 260).
- 14 unit tests in `src/lib/ai/compat-score.test.ts`.

**Caller (single, narrow):** `src/lib/profile-public.ts:7,197-214`
- `getMatchPercentForViewer(viewerId, targetId)` calls `scoreCompatibility(...)`; returns `Math.round(result.score)` only — **drops `reason`, `sharedSports`, `skillFit`, `scheduleFit`, `proximityFit`, and `source`** (line 214).

**UI surface:** `src/app/[locale]/u/[username]/page.tsx:114-117, 184-191`
- Only the integer percent is shown via `<MatchPercentPanel ... percent={matchPercent} breakdown={breakdownRows} />`.
- `breakdownRows` is hardcoded to `[]` (line 119: `const breakdownRows: MatchBreakdownRow[] = [];`).
- `MatchPercentPanel` itself (`src/components/profile/MatchPercentPanel.tsx`) has **no slot for the AI-generated `reason` string** (per spec §5: *"87% match. Both like football after work, are within 2.4km..."*) — comment at lines 15–19 even labels the panel as "placeholder logic … TODO until matching agent A* lands".
- No compat surface on `/today`, `/groups/*`, or matching results screens — only when viewing another user's public profile.

**Verdict source:** `src/lib/demo/scoring-proofs.ts:272-279` — `status: "pending"` with note *"compatibility scoring UI is not claimed"*. Lib is live; UI is stub.

---

### 3. Photo sport extraction — MISSING

**Lib:** Does not exist.
- No `src/lib/ai/photo-extract.ts`.
- No server action in `src/lib/ai-actions.ts` for vision (`grep -rn "getVisionModel"` outside `groq.ts` returns zero hits).
- `getVisionModel()` exported at `src/lib/groq.ts:38-40`, default model `"meta-llama/llama-4-scout-17b-16e-instruct"` matches spec §1; never imported.

**UI (stub):** `src/components/onboarding/PhotoForm.tsx:42-54`
- `localPhotoAnalyze()` returns three hardcoded sport suggestions with fake confidences.
- Comments at lines 43–46 and 128–130 explicitly note: *"Wave 0 audit found no `photoAnalyzeAction` server action wired in `src/lib`. This stub keeps the demo flow visible; a later wave (A11/A12) will swap to real Groq vision via the server action."* — still true.
- `handleAnalyze()` uses `setTimeout(..., 520)` to fake latency before calling the stub (lines 89–103).
- `handleFinish()` does **not persist** the picked AI sports — comment line 128–130 admits no commit action wired.

**Upload pipeline:** `PhotoForm.tsx:74-87` `handleFile` only creates a local `URL.createObjectURL(...)` preview; line 83 banner says *"Photo uploads are being wired up — your photo will save in a later step."* So even the upload→R2 path is not connected from this form, let alone any vision call.

**Verdict source:** `src/lib/demo/scoring-proofs.ts:262-269` — `status: "pending"`, note *"Manual photo step exists; Groq vision extraction is not claimed."* Honest. Full 500p rubric row unclaimed. Per prior audit (`_partials-2026-05-09-1423/03-ai-wiring.md` §3), implementing this is a ~15-min job (vision call + base64 image + cache + wire to PhotoForm).

---

### 4. AI Captain Brief — PARTIAL (lib shipped, never called)

**Lib (good):** `src/lib/ai/captain-brief.ts`
- `buildFallbackCaptainBrief(input)` — deterministic, lines 79–105: picks closest venue, describes weather, no decisions list.
- `generateCaptainBrief(input)` — AI orchestrator, lines 123–174.
  - `isGroqConfigured()` check (line 126); cache via `getOrCompute(["captain-brief","captain-brief-v1",model,JSON.stringify(input)], 24h, ...)` (lines 129–165).
  - `chatJson(model, [...], captainBriefSchema, {temperature:0, maxTokens:600})`.
  - `normalizeAiBrief()` clamps summary ≤280 chars, decisions ≤3, reason ≤200 chars (lines 112–121).
  - On error → returns `{brief: buildFallbackCaptainBrief(input), source:"fallback"}` (line 173).
- Tests in `src/lib/ai/captain-brief.test.ts` (4 cases).

**Callers:** ZERO. `grep -rn "generateCaptainBrief\|buildFallbackCaptainBrief" src/ --exclude='*.test.ts'` → only the definitions.

**UI surface:** `src/components/group/CaptainBriefPanel.tsx` is rendered at `src/app/[locale]/groups/[groupId]/page.tsx:148, 376` — but it's a **static layout component** that takes `members`, `suggestedVenue`, `suggestedTime`, `weather` as props and renders confirmed-count + member avatars + venue/time/weather stats. It has **no field for AI summary or decisions**, no call into `generateCaptainBrief()`, and the group page passes `weather={null}` and a placeholder venue (line 152–153: `{ name: "Pick a venue", sub: "Tap to suggest" }`).

The closest "AI Captain action" surface is `src/components/event/CaptainAutoEventReveal.tsx` which uses an `<AIMark/>` icon (line 142) but its content (`recommendedSubLine`, weather fit, etc.) is built deterministically in `src/app/[locale]/events/[eventId]/page.tsx:49-194`. No call to `generateCaptainBrief()` there either.

**Auto-event setup (spec §7, plan task #10):** Deterministic only. Top venue picked at `events/[eventId]/page.tsx:50` (`venueCandidates[0]`); weather computed via `src/lib/weather.ts`. No AI plan generation. The 1000p auto-event row is marked `live` in `scoring-proofs.ts:182-208` for the deterministic core, and the 1000p captain-brief row is marked `fallback` at line 281–288 (note: *"Captain summary panel is deterministic; Groq-generated brief is not required for core demo"*). Honest — but the AI brief is the difference between `fallback` and `live` for that row.

---

### 5. Smart teammate recommendations — MISSING

- No `src/lib/recommendations.ts`, no `src/lib/ai/recommend*.ts`.
- `grep -rn "recommend" src/lib/ai/` returns zero.
- The hits in `grep -rn "recommend" src/`: all about *venue* recommendations (`recommendedSubLine`, weather `indoor_recommended` enum), not teammate ranking.
- No "Best fit today" / "Nearby and same sport" / "Good captain candidate" / "Balances teams" surfaces in `/today`, group sidebar, or invite drawer.
- Group invite drawer itself: `grep -rn "invite.drawer\|InviteDrawer"` → not found in components.
- `scoring-proofs.ts:289-297` claims `status: "pending"`, points 200 (less than the spec's 300p), evidence label *"invite drawer"* — honest given current state.

This is implementable as deterministic ranking (no Groq required) per the prior audit's "Win 4". Roughly 200–300p unclaimed.

---

### 6. Cached AI fallbacks (cache hygiene)

**Used by:** every Groq call.
- `bio-extract.ts:64` — key `["bio-extract","bio-v1",model,trimmed]`, 24h TTL.
- `compat-score.ts:208-215` — key `["compat-score","compat-v1",model,userFingerprint(a),userFingerprint(b)]`, 24h TTL.
- `captain-brief.ts:129-138` — key `["captain-brief","captain-brief-v1",model,JSON.stringify(input)]`, 24h TTL.

**Storage:** `src/db/schema.ts:482-486` (`ai_cache(input_hash PK, output_json JSONB, created_at)`); migration `drizzle/0007_cultured_kree.sql:1-5`.

**Hash:** SHA-256 over space-joined parts (`cache.ts:13-20`); deterministic + opaque (no PII in plaintext).

**Demo seed preload (spec §2 *"Demo seed may preload cache rows so the presentation path survives Groq latency"*):** **MISSING.** `scripts/seed-demo.ts` and `scripts/seed.ts` write zero `ai_cache` rows. Demo UI surfaces the count (`/demo` page line 78, `DemoHealth.tsx:54-56`) but always reports `0` with no preload, so a Groq-off demo today shows fallback text rather than cached AI text.

---

### 7. Determinism + safety summary

| Module | Groq gate | Cache | Deterministic fallback | Logging hygiene |
|---|---|---|---|---|
| `groq.ts` | `if (!apiKey) throw GroqError("groq_not_configured")` (lines 51–53) | n/a | n/a | No log of key, body, or response |
| `cache.ts` | n/a | SHA-256 + 24h TTL | n/a | No log of input parts |
| `bio-extract.ts` | `isGroqConfigured()` line 61 + try/catch line 62–91 | yes | `extractSportsByKeyword` | No log of bio |
| `compat-score.ts` | `if (!isGroqConfigured())` line 198 + try/catch line 206–261 | yes | `scoreCompatibilityDeterministic` | No log of profiles |
| `captain-brief.ts` | `isGroqConfigured()` line 126 + try/catch line 127–171 | yes | `buildFallbackCaptainBrief` | No log of input |
| `ai-actions.ts` | delegates to `extractSportsFromBio` | delegates | empty array if no bio | No log |

Spec §9 prompt-injection rules: model instructions precede user content in every system prompt; user content is JSON-delimited (`compat-score.ts:218-234`, `captain-brief.ts:140-156`); zod schemas reject unsupported sports; no model-driven mutations exist (Groq is explain-only). All checks pass.

---

## Top fixes (in priority order)

1. **Wire `extractSportsForCurrentUserAction()` into `ProfileForm.tsx`** (~5 min) — replace `localBioSuggest` with a `useTransition`+server-action call. Unlocks the 500p bio row from `fallback` → `live`.
2. **Wire `generateCaptainBrief()` into the captain event panel** (~10 min) — call in `events/[eventId]/page.tsx` after deterministic plan locks; render summary/decisions in `CaptainBriefPanel` (needs new prop) or `CaptainAutoEventReveal`. Unlocks 1000p captain-brief + reinforces 1000p auto-event.
3. **Implement `src/lib/ai/photo-extract.ts` + server action + wire to `PhotoForm.handleAnalyze()`** (~15 min) — base64 image → Groq vision → cache → typed suggestions. Unlocks 500p photo row.
4. **Surface compat `reason` text on profile (and on `/groups/[id]`)** — extend `getMatchPercentForViewer` to return `reason` + `breakdown`; extend `MatchPercentPanel` with a reason line. Confirms compat row is genuinely live and aligns with spec §5 sample copy.
5. **Add `src/lib/recommendations.ts`** with deterministic ranking ("best fit today", "nearby same sport", "good captain", "balances teams") and surface in `/today` after-prompt drawer. Unlocks 200–300p.
6. **Demo seed: preload `ai_cache` rows** for one demo bio + one demo pair + one demo captain-brief input (matching the seeded demo bio/group/event), so Groq-off presentation still shows real AI text. Closes spec §2 expectation and converts the captain-brief / compat rows to "live (cached)".
7. **Health endpoint: log/echo configured model IDs** (`src/lib/health.ts`), per spec §1 *"Startup health should log configured model IDs"*.
