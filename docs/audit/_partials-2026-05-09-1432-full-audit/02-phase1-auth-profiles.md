# 02 — Phase 1: Auth & Profiles Audit

Audit date: 2026-05-09
Specs: `docs/specs/12-implementation-plan.md` §3 · `docs/specs/04-auth-and-profile.md` · `docs/specs/06-ui-flows.md` (§5–§6)

## Headline

Phase 1 is **mostly DONE for auth + profile + onboarding shell**, but **PARTIAL/MISSING for the photo pipeline**. Auth, sessions, recovery codes, signup→onboarding routing, sport selection, location, and settings ship cleanly. The R2 adapter, sharp re-encoder, and `uploadProfilePhotoAction` server action are all written — but **no UI surface calls them**, so profile-photo upload is dead code from a user POV. AI analysis status (`profile_photos.ai_status`/`ai_suggestions`) is schema-only: nothing reads or writes those columns. The E2E "signup → onboarding → /today" path runs end-to-end, but there is no Playwright test that proves it (only a visual screenshot harness exists).

## Verdict Table

### Phase 1 tasks (spec §3, items 1–9)

| # | Task | Verdict | Evidence |
|---|---|---|---|
| 1 | Postgres schema base | DONE | `src/db/schema.ts:25-487` (users, user_sports, profile_photos, prompts, groups, events, votes, messages, notifications, auth_rate_limits, ai_cache, etc.); 11 migrations `drizzle/0000_*.sql` … `drizzle/0010_*.sql` |
| 2 | iron-session | DONE | `src/lib/session.ts:1-63`; cookie name `showup2move_session`, httpOnly, sameSite lax, 30-day maxAge, secret-required-in-prod guard at `:24` |
| 3a | Signup | DONE | `src/lib/auth.ts:100-150` (`signupAction`); UI `src/components/auth/SignupForm.tsx:52-129`; recovery-code reveal `src/components/auth/RecoveryCodeReveal.tsx:54-258`; route `src/app/[locale]/signup/page.tsx:7-127` |
| 3b | Login | DONE | `src/lib/auth.ts:152-190`; UI `src/components/auth/LoginForm.tsx`; redirect to next missing step in `src/lib/auth-form-actions.ts:24-39` |
| 3c | Logout | PARTIAL | `src/lib/auth.ts:255-258` (`logoutAction`) exists but has zero callers in `src/components` (grep miss). No UI button anywhere. Settings page `src/app/[locale]/settings/page.tsx:1-461` exposes profile/sports/location/privacy/reminders/integrations — no logout |
| 3d | Recovery | DONE | `src/lib/auth.ts:192-253`; UI `src/components/auth/RecoverForm.tsx`; route `src/app/[locale]/recover/page.tsx`; rotates code + re-saves session `:223-251`; recovery code generator `src/lib/recovery.ts:6-18` (format `SM2M-XXXX-XXXX`) |
| 4 | Profile settings | DONE | `src/app/[locale]/settings/page.tsx:1-461` w/ tabs profile/sports/location/privacy/reminders/integrations; actions in `src/lib/settings-actions.ts:42-150` (basics, sports, location, visibility); inline edit panels `src/components/settings/InlineEditPanels.tsx` |
| 5a | Onboarding shell + URL persistence | DONE | Path-persisted steps `/onboarding/{profile,sports,location,photo}` at `src/app/[locale]/onboarding/*/page.tsx`; nextPostLoginPath redirects per missing step `src/lib/auth-form-actions.ts:24-39`; `/today` re-checks at `src/app/[locale]/today/page.tsx:33-43` |
| 5b | Progress banner / 4-dot ratchet | DONE | `src/components/onboarding/WizardMobileHeader.tsx:33-47` renders 4 progress pips per step; setup banner `src/components/onboarding/SetupBanner.tsx:12-77` shown on `/today` `src/app/[locale]/today/page.tsx:160-183` |
| 5c | Sticky mobile actions (above keyboard) | DONE | `src/components/onboarding/WizardStickyActionBar.tsx:29-131`; visualViewport keyboard offset math at `:43-61` ports the Glamingo pattern |
| 6a | Sport selection | DONE | `src/components/onboarding/SportsForm.tsx:75-298` (6-tile grid); `src/lib/onboarding.ts:82-152` (`setUserSportsAction`); writes `userSports` rows via `src/db/schema.ts:61-80`. ⚠ `padel` tile silently maps to `tennis` on submit (`SportsForm.tsx:42-49`) — schema-locked, but a fake demo signal |
| 6b | Skill levels | DONE | 3-tier segmented control beginner/casual/pro → numeric 1/3/5 in `SportsForm.tsx:52-56`; persisted to `user_sports.level` and aggregated to `users.skillLevel` (avg) in `src/lib/onboarding.ts:99-103` |
| 7a | Photo upload | MISSING (UI) | Server-side path is complete (`src/lib/upload-actions.ts:21-115` `uploadProfilePhotoAction`), but `src/components/onboarding/PhotoForm.tsx:74-87` only sets a local `URL.createObjectURL` preview and a banner saying "Photo uploads are being wired up". `Finish` button at `:127-132` no-ops to `/today`. Settings has no photo panel either. The action has zero callers — confirmed via `grep -rn uploadProfilePhotoAction src` |
| 7b | Photo resizing | DONE (lib only) | `src/lib/uploads.ts:91-97` re-encodes to 512×512 webp via `sharp`, strips EXIF (rotate-then-strip pattern); MIME sniffing via magic bytes `:20-59`; 8 MiB cap `:8`; rejects non PNG/JPEG/WEBP (HEIC announced in UI but rejected by validator) |
| 8 | R2 upload adapter | DONE (lib only) | `src/lib/r2.ts:23-72` lazy S3Client singleton; bucket/endpoint/keys from env; forcePathStyle for R2 quirks; `src/lib/uploads.ts:103-123` `writeToR2` writes object with immutable cache-control |
| 9a | Profile photo rows | PARTIAL | Schema present `src/db/schema.ts:82-103` (`profile_photos` with userId/url/objectKey/aiStatus/aiSuggestions); `upload-actions.ts:64-67` inserts a row inside a transaction and bumps `users.photo_url`. But because no UI calls the action, no rows are ever inserted in practice |
| 9b | AI analysis status | MISSING | `profile_photos.ai_status` defaults to `'pending'` (`src/db/schema.ts:94`) but **no code transitions it** — `grep -rn "ai_status\|aiStatus\|aiSuggestions" src` returns only the schema definition. No analyze action reads, updates, or links to this column. PhotoForm's "Analyze with AI" is a 520ms `setTimeout` stub in `PhotoForm.tsx:48-103` that returns hard-coded `[tennis 76%, running 62%, football 58%]` and persists nothing |

### Phase 1 "Done when" gate

| Gate | Verdict | Evidence |
|---|---|---|
| E2E signup → onboarding → `/today` passes | MISSING | Only a screenshot harness exists at `e2e/visual.spec.ts:33-56` (snapshots all routes anonymously, expects redirects to login for authed paths). No Playwright spec drives an actual signup→onboarding→today flow. `src/tests/` only contains `stubs/server-only.ts`. Vitest covers unit/contracts but no integration of the full path |

### Rubric coverage matrix (spec §3 promises)

| Rubric row | Verdict | Working route/action |
|---|---|---|
| Registration / login | DONE | `/[locale]/signup` (`page.tsx`) → `signupAction` (`auth.ts:100`); `/[locale]/login` → `loginAction` (`auth.ts:152`) |
| Profile creation | DONE | `/[locale]/onboarding/profile` → `updateOnboardingProfileAction` (`onboarding.ts:19-80`); editable in `/[locale]/settings?section=profile` → `updateProfileBasicsAction` (`settings-actions.ts:42`) |
| Sport preferences | DONE | `/[locale]/onboarding/sports` → `setUserSportsAction` (`onboarding.ts:82`); writes `user_sports`; editable in settings via `updateSportsPrefsAction` |
| Profile photo upload | MISSING (no working route) | The server action `uploadProfilePhotoAction` (`upload-actions.ts:21`) is unreachable from the UI. PhotoForm is a stub. No settings panel exposes upload. **This rubric row currently scores 0 in honest scoring.** |
| Skill support | DONE | Per-sport `level` (1/3/5) persisted to `user_sports.level`; aggregate `users.skill_level` updated in `onboarding.ts:99-103`; surfaced in `OnboardingUserState.sports[].level` |

### Spec §4 & §6 (UI Flows §5–§6) details

| Detail | Verdict | Evidence |
|---|---|---|
| Username regex `^[a-zA-Z0-9_-]{3,30}$` | DONE | `src/lib/contracts/auth.ts:7` matches spec exactly |
| Password min 8 | DONE | `src/lib/contracts/auth.ts:11-14` |
| Bcrypt cost ≥10 (spec: 10 hackathon, 12 later) | DONE | `src/lib/auth-crypto.ts:4` `BCRYPT_COST = 12` (already at the post-hackathon target) |
| Dummy hash on failed login/recovery | DONE | `auth.ts:175,211` use `DUMMY_PASSWORD_HASH`/`DUMMY_RECOVERY_HASH` from `auth-crypto.ts:6-10` |
| Session shape (userId, username, fullName, isAdmin, locale) | DONE+ | `src/lib/session.ts:8-15` includes `userUpdatedAt` for staleness checks |
| Session destroyed if user row gone | DONE | `auth-current-user.ts:39-47` and `onboarding-state.ts:48-57` clear session on missing/banned/deleted/stale rows |
| Postgres-backed rate limits | DONE | `src/db/schema.ts:470-480` `auth_rate_limits` table; `src/lib/auth-rate-limit.ts` + `auth-rate-limit.test.ts` |
| Full-name validation Unicode + apostrophe + hyphen | DONE | `src/lib/contracts/auth.ts:22-28` regex `^[\p{L}\p{M}' -]+$` with letter-required refine |
| Recovery code shown once after signup | DONE | `RecoveryCodeReveal.tsx` requires copy/download/checkbox → continue (`:61,242-256`); routes to `/onboarding/profile` |
| Recovery code rendered as monospace tiles | PARTIAL | Tiles render at `RecoveryCodeReveal.tsx:158-178` but spec §5.1 example uses 5 blocks (`RX-7Q-K9-VB-2T`); generator emits `SM2M-XXXX-XXXX` → only 3 visible blocks. Functional, but visually diverges from the canvas screen 01 spec |
| Continue gated by saved-it interaction | DONE | `RecoveryCodeReveal.tsx:61` `canContinue = copied || downloaded || confirmed` (spec says checkbox is the hard gate; current code is more lenient — copy alone unlocks it) |
| Recovery code never logged | DONE | No `console.log`/telemetry references the code; only used in `signupAction` return value and reveal component state |
| Onboarding 4 steps locked: profile, sports, location, photo | DONE | Routes at `src/app/[locale]/onboarding/{profile,sports,location,photo}/page.tsx` |
| Required = profile + sports + location; photo optional | DONE | `auth-form-actions.ts:26-39` uses bio/sports/city/lat/lng to gate; photo never enforced. `today/page.tsx:33-43` enforces same gates |
| App-entry redirect to next missing step | DONE | `auth-form-actions.ts:24-39` (after login); `today/page.tsx:33-43` (every visit) |
| Distance slider continuous 1.0–10.0 step 0.5 | PARTIAL | UI slider is `min=1, max=10, step=0.5` (`LocationForm.tsx:39-41`) but `snapDistance()` at `:45-56` clamps to [1,3,5,10] before submit. Schema/contract limits accepted values; spec §5 explicitly calls out 0.5 km steps as desired. `users.maxDistanceKm` is `smallint` so half-km support requires schema change |
| `aria-valuenow="N"` aria-valuemax="4" progress region | PARTIAL | `WizardMobileHeader.tsx:33` uses `aria-hidden="true"` on the pip array (no `aria-valuenow`). Spec §6 calls for an accessible progress region with `aria-valuenow`/`aria-valuemax` |
| Sticky action bar above iOS keyboard | DONE | `WizardStickyActionBar.tsx:43-61` ports the Glamingo visualViewport math |
| `/today` "Finish setup" banner for optional photo | DONE | `today/page.tsx:160-183`; `SetupBanner.tsx`. ⚠ `showSetup = true` is hard-coded (`today/page.tsx:56`), so the banner shows even if the user already has a photo (because `OnboardingUserState` doesn't carry `photoUrl`) |

## Detailed evidence

### Auth + sessions

`src/lib/auth.ts:100-258` covers signup, login, recovery, logout. `signupAction` at `:100-150` writes a user row with `fullName: parsed.data.username` (placeholder) and immediately saves the session. The full-name string is then overwritten by `updateOnboardingProfileAction` (`onboarding.ts:19-80`). This is acceptable per spec §1: "Collect `full_name` in the first onboarding screen."

Rate limiting is policy-driven (`src/lib/auth-rate-limit.ts`, with covering tests `auth-rate-limit.test.ts`). Login uses both IP+user and user-only buckets (`auth.ts:159-168`). Signup uses an IP bucket (`:107-110`). Recovery uses IP+user (`:201-208`). This matches §7.

### Onboarding wizard

- `ProfileForm.tsx:108-499`: Step 1, fullName + bio + AI sport suggestions. The AI button calls `localBioSuggest` (a deterministic regex stub) — no real Groq call yet (Groq belongs to Phase 4). On `Next`, picked sports are passed through query string `?suggested=` to the next step (`:208-213`).
- `SportsForm.tsx:75-298`: Step 2. 6 tile grid w/ per-sport segmented level control; submits via hidden inputs to `onboardingSportsFormAction`. Padel tile maps to tennis on submit — flagged in code (`:42-49`) as a deterministic-first fallback until schema accepts padel.
- `LocationForm.tsx`: Step 3. City + geolocation button + slider. Snapping divergence noted above.
- `PhotoForm.tsx:63-409`: Step 4. Drop zone + AI analyze button. **All photo persistence is stubbed.** `handleFile` (`:74-87`) creates a local blob URL and shows a banner. `handleFinish` (`:127-132`) just navigates to `/today`. The component holds `picked: Set<SportKey>` (`:71`) but never sends it to the server.

### Photo pipeline

The library code in `src/lib/r2.ts`, `src/lib/uploads.ts`, and `src/lib/upload-actions.ts` is solid: magic-byte sniffing, EXIF strip, 8 MiB cap, sharp 512×512 webp, immutable cache-control, transactional row insert + `users.photo_url` bump + session re-save. Tests cover sniffing/validation in `src/lib/uploads.test.ts`. The gap is purely the missing wire-up:

- `PhotoForm.tsx:74-87` does not import `uploadProfilePhotoAction`.
- Settings has no Photo section. `src/app/[locale]/settings/page.tsx` only renders profile/sports/location/privacy/reminders/integrations panels.
- No `<form action={uploadProfilePhotoAction}>` exists anywhere in the app.

### AI analysis status

`profile_photos.ai_status` (`schema.ts:94`) and `profile_photos.ai_suggestions` (`:95`) are **schema-only**. No code path reads or updates them. The PhotoForm's "Analyze with AI" button calls a 520ms `setTimeout` (`PhotoForm.tsx:91-103`) that returns hard-coded suggestions and never touches the DB. Spec §3 item 9 explicitly lists "Store profile photo rows and AI analysis status" — both halves are inert without UI wiring.

### Settings parity

Spec §6 lists: profile summary · full name · bio · sports · skills · location · photo upload/remove · AI suggestions history · reminder preferences · Strava · recovery rotation · delete/export.

Implemented: profile summary, full name, bio, sports + levels, location (city/lat/lng/distance), privacy (visibility), reminders (placeholder), integrations (Strava placeholder).
Missing in settings: photo upload/remove, AI suggestions history, recovery code rotation, delete/export account, logout button.

## E2E trace: signup → onboarding → /today

Manual walkthrough of the call chain (no Playwright spec exists to run):

1. `GET /[locale]/signup` → `src/app/[locale]/signup/page.tsx` renders `SignupForm`.
2. Form submit → `signupFormAction` (`auth-form-actions.ts:41-61`) → `signupAction` (`auth.ts:100`). On success `state.recoveryCode` is set → `SignupForm.tsx:70-79` swaps to `RecoveryCodeReveal`.
3. User clicks Continue → `router.push('/[locale]/onboarding/profile')` (`RecoveryCodeReveal.tsx:111-114`). Iron-session is already saved by signupAction.
4. `/[locale]/onboarding/profile` → `getCurrentUser` check (`profile/page.tsx:16-20`) → `ProfileForm`. User submits → `updateOnboardingProfileAction` writes fullName+bio, re-saves session, then client routes to `/onboarding/sports`.
5. `/[locale]/onboarding/sports` → `getOnboardingUserState` check → `SportsForm`. Submit → `onboardingSportsFormAction` → `setUserSportsAction` writes user_sports rows and aggregates skillLevel → `state.saved` triggers redirect to `/onboarding/location`.
6. `/[locale]/onboarding/location` → `LocationForm`. Submit → `onboardingLocationFormAction` → `updateOnboardingLocationAction` writes city/lat/lng/maxDistanceKm → redirect to `/onboarding/photo`.
7. `/[locale]/onboarding/photo` → `PhotoForm` (stub). Skip or Finish → `router.push('/[locale]/today')`.
8. `/[locale]/today` → `getOnboardingUserState` re-checks bio/sports/city/lat/lng (`today/page.tsx:33-43`); if all present, renders `TodayPromptCard`.

### Path breaks / divergences

- **Photo upload is silently dropped.** Step 4 collects no persistence; on Finish, R2 is never called and `profile_photos` is never written. The "AI picked" chips chosen by the user are also dropped.
- **`users.photoUrl` is never set during onboarding.** Even after Finish, `Avatar` falls back to initials in chat/groups. SetupBanner on `/today` keeps showing "Add a photo" (hard-coded `showSetup = true` at `today/page.tsx:56`) because OnboardingUserState doesn't surface `photoUrl`.
- **Distance slider snaps from 0.5-step UI to discrete [1,3,5,10] on submit** (`LocationForm.tsx:45-56,128-129`). Demo flow works; the Glamingo-spec UX is half-implemented.
- **No logout UI.** `logoutAction` exists but is unreachable; users have to clear cookies or wait 30 days.
- **No Playwright happy-path test.** Only `e2e/visual.spec.ts` (anonymous screenshots). Spec §3 "Done when: E2E signup → onboarding → /today passes" is unproven.

## Recommended fixes (prioritised, scoped to Phase 1 closure)

1. Wire `uploadProfilePhotoAction` into `PhotoForm.tsx` (drop the stub, send the real `FormData` to the server action). Add a `setUserPhotoSuggestionsAction` so the picked AI sport chips persist to either `user_sports.verified=true` or `profile_photos.ai_suggestions`.
2. Add a Photo panel to `/settings` calling the same `uploadProfilePhotoAction`, with a Remove button that clears `users.photoUrl` and writes a tombstone row.
3. Implement `aiPhotoAnalyzeAction` (or fold into upload) that flips `profile_photos.ai_status` from `pending` → `processing` → `ok|failed` and writes `ai_suggestions`. Even a deterministic seed-aware version closes the rubric promise honestly.
4. Add the missing `photoUrl` field to `OnboardingUserState` and stop hard-coding `showSetup = true` on `/today`.
5. Add a logout button to `/settings` (and the desktop header dropdown) that calls `logoutAction`.
6. Loosen `users.maxDistanceKm` to allow 0.5-km steps (smallint can hold tens of decametres if multiplied; otherwise switch to numeric) OR drop the spec's 0.5 km claim and snap UI to integer 1–10. Fix `aria-valuenow` on `WizardMobileHeader`.
7. Add a Playwright spec at `src/tests/e2e/signup-onboarding-today.spec.ts` (or `e2e/`) that drives the full path with a seeded R2 mock + DB. This is the literal Phase 1 "Done when" gate.
8. (Cosmetic) Tweak `generateRecoveryCode` to emit 5 blocks (e.g. `SM2M-XXXX-XXXX-XXXX-XXXX`) so the reveal card matches the canvas screen 01 layout. Update the regex in `recoveryCodeSchema` accordingly.

## Files touched in this audit

- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/db/schema.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/session.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth-crypto.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth-current-user.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth-form-actions.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth-rate-limit.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/contracts/auth.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/onboarding.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/onboarding-state.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/recovery.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/r2.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/uploads.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/upload-actions.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/settings-actions.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/auth/SignupForm.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/auth/RecoveryCodeReveal.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/ProfileForm.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/SportsForm.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/LocationForm.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/PhotoForm.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/SetupBanner.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/WizardMobileHeader.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/onboarding/WizardStickyActionBar.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/app/[locale]/signup/page.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/app/[locale]/login/page.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/app/[locale]/recover/page.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/app/[locale]/onboarding/{profile,sports,location,photo}/page.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/app/[locale]/today/page.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/app/[locale]/settings/page.tsx`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/drizzle/0000_glamorous_black_knight.sql`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/e2e/visual.spec.ts`
