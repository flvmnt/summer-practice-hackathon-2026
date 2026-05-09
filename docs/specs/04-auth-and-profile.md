# 04 - Auth & Profile

## 1. Reference Pattern

Use the curbe-style lightweight profile system:

- username + password signup
- `iron-session` encrypted cookie
- `bcryptjs` password hashing
- one-time recovery code shown after signup
- server actions for signup, login, recovery, logout
- Postgres-backed rate limiting for production

This fits the challenge better than OAuth-first auth because judges can create demo accounts quickly and the team avoids provider setup risk during the hackathon.

## 2. User-Facing Flow

### 2.1 Signup

1. User opens `/signup`.
2. User enters username and password.
3. Server validates username format and password strength.
4. Account is created.
5. User is shown a recovery code once.
6. User lands on `/onboarding/profile`.

Success state:

```text
Account ready

Save this recovery code:
SM2M-8F3K-2Q9P

[I saved it]
```

### 2.2 Login

1. User opens `/login`.
2. User enters username and password.
3. Server compares password with real hash or dummy hash to avoid username enumeration timing leaks.
4. Session cookie is saved.
5. User lands on `/today`.

### 2.3 Recovery

1. User opens `/recover`.
2. User enters username, recovery code, and new password.
3. Server rotates the recovery code after successful recovery.
4. User is logged in.
5. User sees the new recovery code once.

## 3. Session Shape

```ts
type SessionData = {
  userId?: string;
  username?: string;
  isAdmin?: boolean;
  locale?: 'ro' | 'en';
};
```

Cookie settings:

| Setting | Value |
|---|---|
| name | `showup2move_session` |
| httpOnly | true |
| secure | true in production |
| sameSite | `lax` |
| maxAge | 30 days |

## 4. Profile Fields

Required by rubric:

| Field | Required | Scoring coverage |
|---|---:|---|
| username | yes | registration/login |
| bio | yes during onboarding | profile creation, AI text extraction |
| sports | yes during onboarding | sports preferences |
| skill level | yes during onboarding | skill level/preferences |
| city/home point | yes during onboarding | proximity matching, maps |
| photo | optional | profile photo upload, AI vision extraction |

Nice-to-have:

| Field | Purpose |
|---|---|
| preferred time slots | improves matching |
| maximum distance | makes proximity useful |
| language | RO/EN bonus |
| email | optional reminders and calendar invites |

## 5. Onboarding Steps

The onboarding should be fast enough for a judge to complete live.

```text
/onboarding/profile
Step 1: Bio
  "Tell us what you like to play"
  [textarea]
  [Suggest sports with AI]

/onboarding/sports
Step 2: Sports
  selectable sport chips with skill steppers
  [Football beginner/intermediate/advanced]
  [Basketball beginner/intermediate/advanced]

/onboarding/location
Step 3: Location
  city input + "use my location"
  distance slider: 1km, 3km, 5km, 10km

/onboarding/photo
Step 4: Photo
  upload optional photo
  [Analyze photo with AI]

/today
First prompt appears immediately
```

## 6. Profile Pages

### Private settings: `/settings`

Sections:

- profile summary
- bio edit
- sports and skill levels
- city, map pin, max distance
- photo upload/remove
- AI suggestions history
- reminder preferences
- connected Strava account
- recovery code rotation
- delete/export account

### Public profile: `/u/[username]`

Shows:

- avatar or initials mark
- username
- sports chips
- skill badges
- city only, never exact location
- recent achievements
- "Invite to event" button for logged-in users

Privacy rules:

- exact `home_point` is never exposed publicly
- email is never exposed
- profile photo uses resized webp only
- deleted users render as `deleted_user`

## 7. Rate Limiting

Use a Postgres-backed `auth_rate_limits` table, not an in-memory Map, because Railway can restart or scale the process.

| Scope | Limit | Window |
|---|---:|---:|
| login by IP + username | 5 failures | 15 min |
| login by username | 10 failures | 15 min |
| signup by IP | 10 attempts | 60 min |
| recovery by IP + username | 3 failures | 30 min |

## 8. Security Checklist

- Password minimum: 8 characters.
- Username regex: `^[a-zA-Z0-9_-]{3,30}$`.
- Bcrypt cost: 10 for hackathon, 12 later if latency allows.
- Dummy hash compare on failed login/recovery.
- Session destroyed if user row no longer exists.
- Route handlers verify session and ownership.
- Mutations validate with zod and return typed action errors.

## 9. Tests

Unit:

- username validation
- password validation
- recovery code format
- rate limit bucket behavior

Integration:

- signup creates user and session
- duplicate username is rejected
- login succeeds/fails correctly
- recovery rotates code
- deleted user clears session

E2E:

- signup -> recovery code -> onboarding -> `/today`
- login -> logout -> login
- recovery with old code fails after rotation

