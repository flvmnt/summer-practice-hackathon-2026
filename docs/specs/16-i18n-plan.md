# 16 - I18n Plan

This plan is adopted scope. It follows the Glamingo-style discipline: locale JSON files, route-level locale prefixes, and a CI lint gate that keeps Romanian and English keys in lockstep.

## 1. Goal

- Romanian is primary.
- English is secondary.
- Use `next-intl`.
- Use URL prefixes: `/ro/...` and `/en/...`.
- Keep visible UI strings in JSON message files.
- Show a language switch on `/today` for demo proof before claiming the multi-language bonus row.

## 2. Scope

Translate:

- UI chrome and navigation
- form labels, validation messages, and action error copy
- empty, loading, and error states
- in-app notification system messages
- Judge Mode proof labels
- calendar/export generated copy
- demo seed-visible system text

Do not translate:

- usernames
- full names
- bios
- chat messages
- venue names
- user-entered event titles or descriptions

## 3. Routing

Supported locales:

- `ro`
- `en`

Default locale: `ro`.

Final route shape:

```text
/ro/...
/en/...
```

The root `/` redirects to `/ro`. Public API routes stay unprefixed.

## 4. Storage

- Anonymous users resolve locale from the URL prefix first.
- Later auth phases store `users.locale`, defaulting to `ro`.
- Session locale mirrors the profile locale after login.
- Locale changes update both the profile and session when authenticated.

## 5. Message Files

Current foundation:

```text
messages/ro/common.json
messages/en/common.json
```

As surfaces grow, split namespaces by product area:

```text
messages/{locale}/auth.json
messages/{locale}/onboarding.json
messages/{locale}/today.json
messages/{locale}/groups.json
messages/{locale}/events.json
messages/{locale}/notifications.json
messages/{locale}/judge.json
```

## 6. Implementation Phases

1. Phase 0: add `next-intl`, locale routing, starter `common.json`, and `pnpm lint:i18n`.
2. Phase 1: auth/onboarding strings, validation copy, safe locale redirects, and profile/session persistence.
3. Phase 2: ShowUpToday prompt, match states, queue/no-match copy, and locale-aware action errors.
4. Phase 3: group chat, event chat, notification copy, and system messages.
5. Phase 4: AI fallback copy, venue/map language, price confidence labels, and captain brief copy.
6. Phase 5: complete `/today` language switch proof, calendar/weather/team-balance/i18n bonus coverage.
7. Phase 6: visual QA in RO and EN at 360, 375, 390, 768, and 1440 widths.

## 7. Testing

Required gates:

- `pnpm lint:i18n` for key/type parity.
- Unit tests for locale resolution and redirect helpers once auth routing exists.
- Playwright smoke for `/ro/today` and `/en/today`.
- Mobile screenshots in both locales for long Romanian strings.
- Judge Mode must mark multi-language as unclaimed until `/today` can switch languages in the real flow.

## 8. Risk Controls

- Romanian copy is often longer; buttons and cards need stable responsive dimensions.
- Server actions should return stable error codes, not translated strings.
- Translation work must land with the feature slice that introduces the UI, not as a late bulk rewrite.
- i18n must not reintroduce PWA, native, Web Push, Google OAuth, or other rejected scope.
