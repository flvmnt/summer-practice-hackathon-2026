# 05 - AI Features

## 1. AI Goal

AI should make the product feel smarter without becoming a fragile demo dependency. The app must still work if Groq is slow or unavailable.

Primary vendor: **Groq**.

| Task | Model | Why |
|---|---|---|
| Bio sport extraction | `llama-3.3-70b-versatile` | strong structured text reasoning |
| Compatibility scoring | `llama-3.3-70b-versatile` | produces useful explanations |
| Teammate recommendations | `llama-3.3-70b-versatile` | ranking + explanation |
| Photo sport extraction | `meta-llama/llama-4-scout-17b-16e-instruct` | current lightweight Groq vision model |

Note: model availability can be restricted at the Groq project/org level. During implementation, verify allowed models with `https://api.groq.com/openai/v1/models` and keep model IDs configurable through environment variables.

All calls happen server-side through `src/lib/groq.ts`.

## 2. Structured Output Contract

Every AI call must return JSON parsed by zod. Invalid JSON is retried once with a repair prompt. If still invalid, fall back to deterministic logic.

```ts
type SportSuggestion = {
  sport: SportKey;
  confidence: number; // 0..1
  reason: string;
};

type CompatibilityScore = {
  score: number; // 0..100
  sharedSports: SportKey[];
  skillFit: 'balanced' | 'mentor' | 'mismatch';
  scheduleFit: 'high' | 'medium' | 'low';
  proximityFit: 'near' | 'same_city' | 'far';
  reason: string;
};
```

## 3. Feature 1: Bio -> Sports

Rubric coverage: **Identify sports/interests from profile description - up to 500p**.

Input:

- user bio
- supported sports list
- current city and skill level if available

Output:

- up to 5 sport suggestions
- confidence
- reason

Prompt sketch:

```text
You are extracting sports preferences for a spontaneous sports matching app.
Return only JSON that matches the provided schema.

Supported sports:
football, basketball, tennis, volleyball, badminton, running, cycling, yoga,
hiking, table_tennis.

User bio:
"{{bio}}"

Rules:
- Only suggest supported sports.
- Prefer explicit mentions over guesses.
- If the bio says "I run after work", suggest running.
- If confidence is below 0.35, omit it.
```

Fallback:

- keyword dictionary with Romanian and English synonyms.

## 4. Feature 2: Photo -> Sports

Rubric coverage: **Identify sports/interests from profile photo - up to 500p**.

Flow:

1. User uploads profile photo.
2. Server resizes and transcodes to webp.
3. Vision model receives the image and supported sports list.
4. Suggestions are shown as editable chips.
5. User accepts or rejects each suggestion.

Prompt sketch:

```text
Analyze this profile photo for visible sports context.
Return only JSON.

Look for:
- sports equipment
- team jerseys
- court, field, gym, bike, running gear
- activity context

Do not infer sensitive attributes.
Do not identify the person.
Only suggest supported sports with confidence and a short reason.
```

Privacy:

- never ask the model to identify a person
- never derive age, gender, ethnicity, or health status
- store only accepted sport tags, not raw AI analysis unless debugging is enabled locally

## 5. Feature 3: Compatibility Scoring

Rubric coverage: **AI-generated compatibility scoring - up to 300p** and **matching users based on descriptions/interests - up to 500p**.

Use AI as a tie-breaker and explanation layer, not the sole matching engine.

Deterministic score:

| Factor | Weight |
|---|---:|
| shared sport | 35 |
| availability overlap | 25 |
| distance | 20 |
| skill balance | 10 |
| bio/interests similarity | 10 |

AI score:

- only called for candidate pairs that already pass deterministic gates
- cached for 24h by `(user_a, user_b, sport, profile_hashes)`
- returns explanation used in UI

Display copy:

```text
87% match
Both like football after work, are within 2.4km, and have similar skill levels.
```

## 6. Feature 4: Smart Teammate Recommendations

Rubric coverage: **Smart teammate recommendations - up to 300p**.

Surface:

- `/today` after the prompt answer
- group screen sidebar
- manual event invite drawer

Recommendation types:

- "Best fit today"
- "Nearby and same sport"
- "Good captain candidate"
- "Balances teams"
- "Played recently via Strava"

## 7. Auto-Event Setup

Rubric coverage: **Auto-event setup - up to 1000p**.

Flow:

1. Group forms.
2. Server picks top sport and time slot.
3. Venue search returns candidates.
4. Weather check filters outdoor venues if weather is poor.
5. AI chooses a practical event plan.
6. Captain sees one-click confirmation.

AI output:

```ts
type AutoEventPlan = {
  title: string;
  proposedTimeIso: string;
  venueId?: string;
  customLocationText?: string;
  reason: string;
  backupPlan: string;
};
```

## 8. Prompt Injection Guardrails

User bio and chat content are untrusted.

Rules:

- never put secrets in prompts
- model instructions precede user content
- user content is delimited
- output must pass zod
- unsupported sports are dropped
- model cannot perform mutations directly
- AI explanations are plain text and escaped by React

## 9. Latency Budget

| Call | Target | Fallback |
|---|---:|---|
| Bio extraction | < 1.5s | keyword extraction |
| Photo extraction | < 4s | manual chips |
| Pair compatibility | < 1.5s | deterministic score |
| Auto-event plan | < 3s | highest-ranked venue/time |

## 10. Cost Control

- cache AI results
- batch compatibility calls by group
- cap photo analysis to one active photo per user per hour
- cap recommendation refresh to once per prompt window
- disable non-critical AI if `GROQ_API_KEY` is missing

## 11. Tests

Unit:

- schema parsing
- fallback keyword extraction
- deterministic scoring
- prompt builders omit secrets

Integration:

- mocked Groq success
- malformed Groq JSON repair
- Groq timeout fallback

E2E:

- onboarding bio suggestion accepted
- photo upload suggestion accepted
- matched group shows compatibility explanation
