# 03 — Trends & Stagnation Audit

## Velocity

- **Project window**: 24 hours (2026-05-08 13:59 → 2026-05-09 13:21)
- **Total commits**: 38 (1.6 commits/hour avg, with spikes 12:30–13:20)
- **Pace**: Steady high velocity; 3–4 commits per 30min during peak

## File Churn — Top 10 Hotspots

| File | Commits | Domain |
|---|---|---|
| `messages/en/common.json` | 12 | i18n (high churn = copy iteration) |
| `messages/ro/common.json` | 12 | i18n |
| `src/db/schema.ts` | 8 | Data model (migrations/schema design) |
| `drizzle/meta/_journal.json` | 7 | Migration artifacts (expected) |
| `src/lib/chat.ts` | 5 | Chat core (hotspot: needs review) |
| `src/app/layout.tsx` | 5 | Global layout (design token refactor) |
| `src/lib/auth-rate-limit.ts` | 4 | Auth hardening (hotspot: security churn) |
| `src/lib/auth-current-user.ts` | 4 | Auth core (hotspot: session lifecycle) |
| `src/app/[locale]/events/[eventId]/page.tsx` | 4 | Event page (hotspot: event feature growth) |
| `src/app/[locale]/today/page.tsx` | 4 | Today screen (hotspot: matching UI) |

**Hotspots flagged (>10 commits or unstable contract)**:
- `messages/*.json`: Localization copy churn (acceptable, demo iteration)
- `src/lib/chat.ts`: 5 commits → review message/notification boundary
- `src/lib/auth-*.ts`: 4+4 = 8 commits across auth → verify session lifecycle is stable
- `src/app/[locale]/events/[eventId]/page.tsx`: 4 commits → event feature scope creep risk

## Stagnation Map — Top 5 Least-Touched Rows (28-row rubric)

Rank by commits ascending; zero-touched rows signal demo risk:

1. **8-Profile photo upload** (0 commits)
   - Spec: `docs/specs/06-ui-flows.md` § Photo Upload
   - Impact: No upload handler, R2 integration, or MIME sniff
   - Attack: Create `src/lib/upload-actions.ts` + handler

2. **15-Match confirmation workflow** (0 commits)
   - Spec: `docs/specs/14-matching-and-event-algorithm.md` § Confirmation
   - Impact: No UI for user to confirm matched group membership
   - Attack: Add `ConfirmMembershipButton` to group card + action

3. **16-Identify sports from bio (AI extraction)** (0 commits)
   - Spec: `docs/specs/08-groq-fallbacks.md` § Bio Extraction
   - Impact: No Groq text extraction; matching uses static form chips only
   - Attack: Create `src/lib/groq-bio.ts` + cache in `ai_cache` table

4. **17-Identify sports from photo (AI vision)** (0 commits)
   - Spec: `docs/specs/08-groq-fallbacks.md` § Vision Extraction
   - Impact: No photo → sport inference
   - Attack: Add vision call in upload handler + suggest chips UI

5. **19-Smart teammate recommendations** (0 commits)
   - Spec: `docs/specs/14-matching-and-event-algorithm.md` § Candidate Ranking
   - Impact: No ranked invite suggestions in group UI
   - Attack: Create `src/lib/candidate-ranking.ts` + drawer component

## Test Coverage on New Code

- **Commits with tests**: 3 (feat=1, fix=2)
- **Commits without tests**: 35 (feat=15, fix=6)
- **Test-on-new-code ratio**: **8%** (severe debt)
- **Flag**: 15 features shipped untested; hottest area: matching, chat, event flows

## Fix vs Feature Ratio

- **feat**: 16 commits (42%)
- **fix**: 8 commits (21%)
- **chore/docs/db**: 14 commits (37%)
- **Fix ratio**: **33.3%** (stability concern threshold; healthy <30%)

*Interpretation*: High fix count suggests discovery-driven hardening (auth, session, chat race); acceptable for hackathon sprint.

## Doc vs Code Churn

- **Doc commits** (docs/ + messages/): 18
- **Code commits** (src/ + drizzle/): 140
- **Ratio**: **1:7.8** (healthy range 1:5–1:10)

*Interpretation*: Slightly under-documented but within acceptable bounds; heavy i18n churn inflates doc ratio.

---

## Single Highest-Leverage Stagnant Attack

**#8-Profile photo upload** → **#16-Bio extraction** → **#17-Photo suggestion** form a dependent chain:

```
create src/lib/upload-actions.ts
├─ MIME sniff, reject oversized/unsafe
├─ Resize to webp, write to R2, record URL
├─ On success: call src/lib/groq-bio.ts (text) + vision (photo)
├─ Cache results in ai_cache table
└─ Return suggested sport chips to UI

create src/components/onboarding/PhotoUploadForm.tsx
├─ Drag-drop + file input
├─ Call server action
├─ Display suggested sports
└─ Let user confirm/edit

create src/lib/groq-bio.ts & groq-vision.ts
├─ Wrap Groq calls with rate limit
├─ Seed demo-safe outputs in cache
└─ Return chip suggestions
```

**Files to create (concrete demo-ready path)**:
- `src/lib/upload-actions.ts` — R2 upload + validation
- `src/lib/groq-bio.ts` — Bio extraction with cache
- `src/lib/groq-vision.ts` — Photo vision with cache
- `src/components/onboarding/PhotoUploadForm.tsx` — UI
- Database: `ai_cache` table already exists (commit b7abe93); migrate if needed

**Time to demo-ready**: ~45min (upload handler → groq wrapper → UI → seed).

