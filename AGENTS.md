# AGENTS.md - ShowUp2Move

Canonical working instructions for coding agents in this repo.

## Source Of Truth

1. `docs/specs/*.md` are the feature and implementation contracts.
2. `docs/specs/15-doc-refresh-plan.md` records the merged review decisions and contradiction watchlist.
3. `README.md` is the upstream challenge/rubric reference plus project intro.
4. Source code should follow the specs. If code and specs disagree, fix the drift in the same change.

Do not use the downloaded planning pack as canon. It is an idea source only.

## Product

ShowUp2Move is a smart social sports-matching platform for the Haufe summer practice 2026 hackathon.

Core demo loop:

```text
signup -> onboarding -> ShowUpToday -> match -> group chat -> event chat -> event plan -> venue/map/vote -> calendar export -> Judge Mode proof
```

Official rubric maximum: `16,600p`.
Planning target: about `13,000-13,700p`, with no fake credit.

## Locked Decisions

- Web app first: mobile-first responsive Next.js app, not native, not PWA.
- One Next.js app plus optional Railway cron service. No Redis, BullMQ, socket.io, or separate worker by default.
- Auth: username + password, full name in onboarding, recovery code, `iron-session`, `bcryptjs`.
- Database: Railway Postgres with Drizzle. Use numeric `lat/lng` plus Haversine; no PostGIS requirement.
- Uploads: Cloudflare R2 only. No Railway filesystem uploads.
- AI: Groq through server-side wrapper, with `GROQ_TEXT_MODEL` and `GROQ_VISION_MODEL`.
- AI is deterministic-first: cache and seed demo-safe outputs; Groq explains and enriches but does not own hard matching gates.
- Realtime: SSE polling is enough for hackathon scale. Persist messages/notifications; no Redis pub/sub.
- Event chat is real event-scoped chat keyed by `eventId`; group system messages alone do not satisfy the event-chat row.
- Notifications: persistent in-app notification center. Email reminders are useful if configured. Web Push is stretch only.
- Calendar: `.ics` export is the committed calendar proof. Google Calendar OAuth is stretch.
- Wearables: claim points only with real Strava OAuth/import or an explicitly accepted labeled fixture. A greyed coming-soon button scores 0.
- Judge Mode: guarded demo route/status endpoint with live/seeded/fallback proof per rubric row.
- Lighthouse target: 95+ mobile and desktop. `/today` Lighthouse must use an authenticated seeded demo session.

## Expected Stack

- Next.js 16 App Router, React 19, TypeScript strict.
- Tailwind 4, shadcn/ui, lucide-react.
- Drizzle + `drizzle-kit`.
- Zod contracts in `src/lib/contracts/`.
- Vitest for unit/integration tests, Playwright for E2E, axe for accessibility smoke.
- Railway deploy, Cloudflare R2, Open-Meteo, Overpass/OpenStreetMap, Groq.

## Expected Layout

Follow `docs/specs/01-architecture.md`. Important boundaries:

- `src/app/` for routes.
- `src/components/` for UI only; do not import `src/db` or `src/server`.
- `src/lib/` for isomorphic helpers and contracts.
- `src/server/actions/` for server actions.
- `src/db/schema.ts` for Drizzle schema.
- `scripts/seed-demo.ts` must be guarded and reset only demo-owned rows.

## Implementation Rules

- Validate all user input with zod before DB writes.
- Server actions return one consistent discriminated result shape from the contracts.
- Do not throw user-facing errors across the server-action boundary.
- Keep mutations ownership-checked: group, event, vote, message, notification, upload.
- Rate-limit auth, uploads, AI requests, chat sends, SSE opens, and demo seed/reset.
- Never log recovery codes, secrets, exact home coordinates, or raw private AI inputs.
- Upload handling must sniff MIME, reject spoofed/large/unsafe images, strip metadata, resize to webp, write to R2, and delete replaced objects.
- Demo reset requires a `demoRunId` or equivalent ownership marker, including child tables and caches.
- Use stable dimensions for mobile UI, sticky action bars, maps, chat composer, vote panels, and proof rows.
- Every empty/loading/error state needs a visible next action or fallback.

## UX Rules

- First authed screen is `/today`.
- Onboarding uses path-persisted steps: `/onboarding/profile`, `/onboarding/sports`, `/onboarding/location`, `/onboarding/photo`.
- Required onboarding is profile, sports, location. Optional photo/AI suggestions can surface as a `/today` setup banner after required steps.
- Mobile nav: Today, Groups, Create, Map, Profile, plus notification entry via header bell.
- Mobile group screen uses Plan, Chat, Players tabs. Do not show all panels at once.
- Public `/map` shows public venue/event pins only. Group center/radius is member-only, approximate, and labeled.
- Public profile and invite routes must not expose private chat, exact member list, or exact locations.

## Testing And Proof

Minimum before demo-ready:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- Playwright happy path: signup -> onboarding -> today yes -> match -> chat -> event -> vote -> `.ics`.
- Two-browser realtime proof for group chat, vote update, and event chat isolation.
- Mobile screenshots at 360/375/390/768/1440 widths.
- Lighthouse artifacts for `/` and authenticated `/today`, mobile and desktop.
- Railway smoke: `/api/health`, signup, upload, prompt, match, chat SSE, event chat SSE, map/list fallback, calendar export, Judge Mode.

## Commit Discipline

- Keep commits concern-sized.
- Use plain conventional subjects, for example:
  - `docs: refresh planning specs`
  - `feat: add recovery-code auth`
  - `db: add matching schema`
  - `test: cover event chat isolation`
- Do not mix unrelated implementation, generated artifacts, and formatting churn.
- Do not use `--no-verify` to bypass hooks unless the user explicitly approves.

## CI/CD And Security Tooling Guidance

Good bonus-ready tooling, in priority order:

1. GitHub Actions: install, lint, typecheck, test, migrate test DB, build, Playwright smoke.
2. Secret scanning: GitHub secret scanning if available, plus `gitleaks` in CI.
3. Dependency audit: `pnpm audit --audit-level high` or an equivalent non-blocking report if noisy.
4. Lightweight pre-commit/pre-push hooks with Husky/lint-staged only if they stay fast.
5. CodeQL for JavaScript/TypeScript if setup time allows.
6. SonarCloud/SonarQube only if there is already an account/token; otherwise it is slower than the points it likely earns.

Do not let tooling block the product loop. Production readiness points come from working deploy proof, health, tests, security basics, and honest demo fallbacks.
