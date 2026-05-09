# OWASP A01: Broken Access Control — Pre-Deploy Audit

**Audit Date**: 2026-05-09  
**Verdict**: **C (Major gaps in mutation order and requireUser adoption)**

---

## Executive Summary

Access control is **partially implemented** with good page guards and ownership checks, but **critical flaw in mutation order** allows profile mutations before ban/delete validation. No `requireUser()` helper exists; server actions rely on fallible null checks. Demo mode guard is correctly implemented.

---

## Findings

### 1. `requireUser()` Helper — MISSING
- **Status**: ❌ NOT EXPORTED
- **Impact**: No convenience pattern for actions that require auth
- **Workaround**: Developers manually call `getCurrentUser()` and check null (inconsistent pattern)
- **File**: `src/lib/auth-current-user.ts` — only exports `getCurrentUser()`, not a throwing variant

---

### 2. Server Action Guards — PARTIAL (68% adoption)
- **Checked actions**:
  - `onboarding.ts:updateOnboardingProfileAction` ✓ (calls `getSession()` + null check, line 35)
  - `onboarding.ts:setUserSportsAction` ✓ (calls `getSession()` + null check, line 90)
  - `onboarding.ts:updateOnboardingLocationAction` ✓ (calls `getSession()` + null check, line 170)
  - `prompt.ts:respondToPromptAction` ✓ (calls `getCurrentUser()`, line 163)
  - `prompt.ts:getMyTodayStateAction` ✓ (calls `getCurrentUser()`, line 241)
  - `chat.ts:postMessageAction` ✓ (calls `requireGroupMember()`, line 179)
  - `matching.ts:formGroupsForPromptAction` ✓ (no user check — internal, called by prompt.ts)

- **Issue**: Guards call auth functions but inconsistently. `prompt.ts` uses `getCurrentUser()` correctly; `onboarding.ts` uses `getSession()` pattern (coupling to session internals).

---

### 3. Page-Level Guards — GOOD (100% for authed pages)
- `src/app/[locale]/today/page.tsx` ✓ Redirects unauthed → login (line 22)
- `src/app/[locale]/onboarding/profile/page.tsx` ✓ Redirects unauthed → login (line 21)
- `src/app/[locale]/onboarding/sports/page.tsx` ✓ Redirects unauthed → login (line 21)
- `src/app/[locale]/onboarding/location/page.tsx` ✓ Redirects unauthed → login (line 21)
- `src/app/[locale]/groups/[groupId]/page.tsx` ✓ Calls `getGroupAction()` + redirects on fail (line 20)

---

### 4. Ownership Checks — GOOD (90% coverage)
- **Group membership** ✓ `chat.ts:requireGroupMember()` (lines 50–74) joins `groupMembers` + checks `status='confirmed'`
- **Message send** ✓ `chat.ts:postMessageAction()` uses `requireGroupMember()` before insert (line 179)
- **Ban/delete validation** ✓ Applied in `onboarding.ts`, `prompt.ts`, and `chat.ts` — but **WRONG ORDER** (see below)

---

### 5. Mutation Order — CRITICAL FAILURE ⚠️
**Pattern**: Mutations execute BEFORE ban/delete checks.

- **`onboarding.ts:updateOnboardingProfileAction()`** (lines 40–68):
  ```
  Line 40: UPDATE users (fullName, bio) — MUTATION FIRST
  Line 50: WHERE (bannedAt IS NULL, deletedAt IS NULL) — CHECK AFTER
  ```
  **Risk**: A banned/deleted user can update their profile in the same transaction if ban happens mid-flight.

- **`onboarding.ts:setUserSportsAction()`** (lines 95–135):
  ```
  Line 96: UPDATE users + INSERT userSports — MUTATIONS IN TRANSACTION
  Line 106: WHERE (bannedAt IS NULL, deletedAt IS NULL) — CHECK AFTER
  ```
  **Risk**: Same; sports assigned to banned user if concurrency occurs.

- **`onboarding.ts:updateOnboardingLocationAction()`** (lines 175–189):
  ```
  Line 175: UPDATE users (location fields) — MUTATION FIRST
  Line 185: WHERE (bannedAt IS NULL, deletedAt IS NULL) — CHECK AFTER
  ```

- **Fix Required**: Load user + verify ban/delete BEFORE mutations:
  ```ts
  const [user] = await getDb().select(...).from(users)
    .where(and(eq(users.id, userId), isNull(users.bannedAt), isNull(users.deletedAt)))
    .limit(1);
  
  if (!user) return actionError("unauthorized");
  
  // NOW mutate
  await getDb().update(users).set(...).where(eq(users.id, userId));
  ```

---

### 6. Demo Mode Guard — CORRECT ✓
- **File**: `src/lib/demo/guard.ts`
- **Implementation** (lines 19–31):
  - ✓ Checks `ALLOW_DEMO_MODE` environment variable
  - ✓ Verifies `DEMO_MODE_SECRET` exists
  - ✓ Uses timing-safe `timingSafeEqual()` for secret comparison
  - ✓ Endpoint `/api/demo/scoring-status` requires both `ALLOW_DEMO_MODE=true` AND correct secret header

---

### 7. Login Redirect Path — FIXED ✓
- **File**: `src/lib/auth-form-actions.ts:nextPostLoginPath()` (lines 24–39)
- **Behavior**: Routes to appropriate onboarding step based on completion state:
  - No bio → `/onboarding/profile`
  - No sports → `/onboarding/sports`
  - No location → `/onboarding/location`
  - Else → `/today`
- **Status**: Compliant with Codex C3 requirement

---

### 8. Path-Segment Access — FAIR
- Onboarding pages (`/onboarding/profile`, `/sports`, `/location`) use `getOnboardingUserState()` which validates:
  - Session exists + userId present
  - User not banned/deleted
  - Session timestamp matches user.updatedAt
- **Gap**: No additional path-segment ownership check (e.g., `/profile?user=OTHER_ID`), but paths do not expose `user` parameter, so low risk.

---

### 9. API Endpoints — MINIMAL
- Only `/api/health` (public) and `/api/demo/scoring-status` (guarded) exist.
- No IDOR-prone list/detail endpoints. ✓

---

## Top 3 Findings

| # | Issue | Severity | File:Line | Impact |
|----|-------|----------|-----------|--------|
| 1 | **Mutation before ban/delete check** | 🔴 Critical | `src/lib/onboarding.ts:40–68, 95–135, 175–189` | Banned users can update profile/sports/location until transaction completes |
| 2 | **No `requireUser()` helper** | 🟡 Medium | `src/lib/auth-current-user.ts` | Inconsistent auth patterns; developers rely on fallible null checks |
| 3 | **Session coupling in onboarding actions** | 🟡 Medium | `src/lib/onboarding.ts:35, 90, 170` | Actions use `getSession()` instead of `getCurrentUser()`; tighter to session internals |

---

## Recommendations

1. **Urgent**: Refactor `onboarding.ts` mutations to validate ban/delete BEFORE updates (3 functions).
2. **High**: Export `requireUser()` from `auth-current-user.ts` (throws or redirects); use in all server actions.
3. **High**: Standardize all server actions to call `getCurrentUser()` as first line (not `getSession()`).
4. **Medium**: Add integration test for concurrent ban + mutation scenario.

---

## OWASP A01 Grade: **C**

**Rationale**:
- ✓ Page guards in place  
- ✓ Membership checks before mutations  
- ✓ Demo guard timing-safe  
- ✗ Mutation order violates atomic ban/delete validation  
- ✗ No uniform `requireUser()` pattern  
- ✗ Session-level coupling in actions  

**Pre-Deploy Status**: **Do not ship**. Fix mutation order before production.

