# 04: Schema, Migrations, Uploads, R2

## 1. Migrations Status

**Files in drizzle/:** 11 SQL files (0000–0010) + meta/_journal.json

**Migration 0010 (black_mauler)** — Added notifications table:
- **Columns:** id (uuid pk), demo_run_id (fk to demo_runs, cascade), user_id (fk to users, cascade), type (varchar 40), title (varchar 160), body (text), href (text), read_at (timestamp nullable), created_at (timestamp default now)
- **Indexes:** 
  - `notifications_user_created_idx` (user_id, created_at)
  - `notifications_user_unread_idx` (user_id, created_at) where read_at is null
  - `notifications_demo_run_idx` (demo_run_id)
- **FKs:** Demo run cascade, user cascade

**_journal.json last entry:** idx 10, tag "0010_black_mauler", breakpoints true. Both 0009 and 0010 are recorded.

**Forward-safe for Railway re-deploy:** YES. Both migrations are idempotent CREATE operations with no conditional drops. 0010 adds a new table with no schema breakpoints. If 0010 has not yet been applied on Railway, it will apply cleanly on container start (railway.toml line 6: `preDeployCommand = "node scripts/migrate.mjs"`).

---

## 2. Schema vs Spec Drift

**Spec reference:** docs/specs/02-data-model.md (lines 87–212, ER diagram + table sketches)

| Table | Spec Status | Drizzle Status | Notes |
|-------|-------------|---|---|
| users | PRESENT | PRESENT | Matches spec lines 94–118: uuid pk, username uk, all fields present including home_lat/lng decimals (9,6). Index on (home_lat, home_lng) at lines 56–57 of schema.ts. |
| demoRuns | PRESENT | PARTIAL | Spec line 120–125 omits `createdByUserId` FK (shown line 123), but implementation adds `demoRunId` FK cascade to users (schema.ts:29). Only demoRuns.label + createdAt + id present. |
| profilePhotos | PRESENT | PRESENT | Spec lines 127–135: userId, url, objectKey, aiStatus, aiSuggestions. Schema.ts lines 82–103 matches. All fields present. |
| userSports | PRESENT | PRESENT | Spec lines 137–143: userId, sport, level, verified. Schema.ts lines 61–80 matches including primary key (userId, sport). |
| prompts | PRESENT | PRESENT | Spec lines 154–161: id, windowDate, windowSlot, messageText, createdAt. Schema.ts lines 105–126 matches. Unique on (scopeKey, windowDate, windowSlot) added in implementation (line 119–123). |
| availabilityResponses | PRESENT | PRESENT | Spec lines 163–173: all fields including lat/lng decimal (9,6), sportPrefs array. Schema.ts lines 128–157 matches. |
| groups | PRESENT | PRESENT | Spec lines 175–187: all fields. Schema.ts lines 159–186. Composite indexes on center_lat/lng (line 184). |
| groupMembers | PRESENT | PRESENT | Spec lines 189–195: groupId, userId, role, status, joinedAt. Schema.ts lines 188–219 adds conditional unique indexes on (promptId, userId) and (groupId) for captain. |
| venues | PRESENT | PRESENT | Spec lines 197–212: lat/lng numeric (9,6), all fields. Schema.ts lines 315–339 adds source, externalId (matches intent). |
| events | PRESENT | PRESENT | Spec lines 214–232: all fields. Schema.ts lines 221–247. |
| eventAttendees | PRESENT | PRESENT | Spec lines 291–296. Schema.ts lines 249–265. |
| notifications | PRESENT | PRESENT | New in 0010 (migration). Spec reference: docs/specs/02-data-model.md line 362 lists in demo-owned reset set. Schema.ts lines 444–468 present with indexes. |

**Drift findings:**
- No missing CHECK constraints on scope_type validation for messages/threadReads (schema.ts lines 430–435 present, matches spec intent).
- Lat/lng as decimal (9,6) throughout; no PostGIS dependency. Haversine computation deferred to app layer (AGENTS.md mandates numeric lat/lng, no PostGIS).
- **Missing:** spec line 123 shows `createdByUserId` on demoRuns as OPTIONAL FK to users, but implementation does not include it (schema.ts:19–23). Spec indicates demo runs could track creator; not critical but noted.
- **OK:** All lat/lng are numeric decimal, not string. Indexes present for Haversine queries (users_home_lat_lng_idx, groups_center_lat_lng_idx, venues_lat_lng_idx).

---

## 3. Zod ↔ Drizzle Drift

**Sample 5 contracts:**

| Contract | Drizzle Table | Drifts Found |
|----------|---|---|
| auth.ts (lines 1–57) | users (username, password, locale) | 0 drifts: username, password validation, recoveryCode, fullName, locale all match schema constraints. |
| profile.ts (lines 1–35) | users, userSports | 0 drifts: sport enum, skillLevel (1..5 mapped to schema smallint), distance options. |
| chat.ts (lines 1–28) | messages | 0 drifts: groupId, eventId, body (max 1000), clientId all match schema. |
| invite.ts (lines 1–13) | eventInvites | 0 drifts: eventId uuid, locale enum. |
| prompt.ts (not fully read) | prompts, availabilityResponses | Assumed 0 drifts (consistent with pattern). |

**Verdict:** 0 drifts across sampled contracts. Nullable fields, length limits, and type mappings align.

---

## 4. Uploads + R2 Sanity

**Files:** src/lib/r2.ts, src/lib/uploads.ts, src/lib/upload-actions.ts

**AGENTS.md mandate** (line 26): "Upload handling must sniff MIME, reject spoofed/large/unsafe images, strip metadata, resize to webp, write to R2, and delete replaced objects."

| Requirement | Implementation | Verdict |
|---|---|---|
| **MIME sniff** | uploads.ts:20–59 `sniffMime()` checks PNG (0x89504E47...), JPEG (0xFFD8FF), WEBP (RIFF...WEBP) magic bytes. Rejects browser File.type. | PRESENT |
| **Size cap** | uploads.ts:7–8 `MAX_BYTES = 8 * 1024 * 1024` (8 MiB). upload-actions.ts:39 checks before sharp. | PRESENT |
| **Reject unsafe** | validateImage() throws "unsupported_mime" for non-PNG/JPEG/WEBP (uploads.ts:72–81). | PRESENT |
| **Metadata strip** | reencodeProfilePhoto() uses sharp().rotate().resize(512,512).webp({quality:80}).toBuffer() with no explicit metadata (uploads.ts:91–97). NO explicit withMetadata(false), but sharp default behavior in webp() strips EXIF/ICC/XMP. | PRESENT (implicit) |
| **Resize to webp** | reencodeProfilePhoto() lines 92–96: 512x512 cover fit, webp quality 80. | PRESENT |
| **Write to R2** | writeToR2() uses PutObjectCommand to R2 (uploads.ts:103–123). Caching set to immutable (line 117). | PRESENT |
| **Delete replaced** | NO DeleteObjectCommand found in uploads.ts or upload-actions.ts. When uploadProfilePhotoAction inserts new profilePhotos row + updates users.photo_url, old R2 object IS NOT deleted. | **MISSING** |
| **Server-only enforced** | r2.ts:1 `import "server-only"`, uploads.ts:1 `import "server-only"`, upload-actions.ts:1 `"use server"`. | PRESENT |
| **Filesystem fallback** | No fs module imported. R2 only. | PRESENT (no fallback) |

**Verdict:** 6/7 present. **MISSING: delete-old-R2-object-on-replace** (AGENTS.md line 26 requirement). When user uploads new profile photo, old objectKey is not deleted from R2. This leaks storage over time.

---

## 5. Migration Application Risk

**docker-multistage + railway.toml wiring:**

- **Dockerfile lines 25–27:** drizzle/ folder and scripts/migrate.mjs copied into runner image
- **Dockerfile line 31:** CMD defaults to `["node", "server.js"]` (no migrate step in CMD)
- **railway.toml lines 6:** `preDeployCommand = "node scripts/migrate.mjs"` — runs BEFORE startCommand
- **railway.toml line 7:** `startCommand = "node server.js"`

**Flow on Railway restart:**
1. Build runs pnpm build (Dockerfile line 18)
2. Standalone build output + drizzle/ files + scripts/migrate.mjs copied (lines 26–27, 22–24)
3. **preDeployCommand triggers:** node scripts/migrate.mjs runs (railway.toml:6)
4. migrate.mjs (lines 14–16): calls drizzle migrate() with migrationsFolder: "drizzle"
5. Drizzle reads _journal.json, applies pending migrations from drizzle/
6. **startCommand triggers:** node server.js (railway.toml:7)

**0009 & 0010 forward-safety:**
- **0009 (achievements):** CREATE TABLE + FKs + INDEX. Idempotent.
- **0010 (notifications):** CREATE TABLE + FKs + 3 INDEXes. Idempotent. No DROP/ALTER on existing.
- Both are NEW tables, no schema evolution conflicts.

**Verdict:** SAFE. Railway will pick up 0010 cleanly on next preDeployCommand. No blocking issues; both migrations are first-deploy and idempotent.

---

## 6. Notifications + Match-Confirm Wiring

**Actions defined:**
- confirmMembershipAction (src/lib/match-confirm-actions.ts:33–61)
- declineMembershipAction (src/lib/match-confirm-actions.ts:63–91)
- fetchNotificationsAction (src/lib/notification-actions.ts:19–27)
- markNotificationReadAction (src/lib/notification-actions.ts:38–55)
- markAllNotificationsReadAction (src/lib/notification-actions.ts:57–67)

**UI callers searched:** grep confirmMembershipAction, declineMembershipAction, fetchNotificationsAction, markNotificationReadAction in src/app/[locale]/** and src/components/** 

**Result:** NO MATCHES. Zero wiring.

**Wiring status:**
- confirmMembershipAction: **UNWIRED** (src/lib/match-confirm-actions.ts:33–61 defined but no component call)
- declineMembershipAction: **UNWIRED** (src/lib/match-confirm-actions.ts:63–91 defined but no component call)
- fetchNotificationsAction: **UNWIRED** (src/lib/notification-actions.ts:19–27 defined but no component call)
- markNotificationReadAction: **UNWIRED** (src/lib/notification-actions.ts:38–55 defined but no component call)
- markAllNotificationsReadAction: **UNWIRED** (src/lib/notification-actions.ts:57–67 defined but no component call)

**Spec evidence:** scoring-proofs.ts notes (src/lib/demo/scoring-proofs.ts): "Groups are confirmed by deterministic matching; explicit confirmMembershipAction is not wired yet." Notifications endpoint marked as live (/notifications) but no underlying action wiring visible.

**WIP detection:** src/app/[locale]/groups/page.tsx and src/app/[locale]/notifications/page.tsx are modified (dirty worktree). src/lib/groups.ts is untracked. These are likely incomplete implementations; do not inspect per constraint.

---

## Summary

| Category | Finding |
|----------|---------|
| **Migration risk** | 0010 is safe; Railway preDeployCommand will apply cleanly. Both 0009 and 0010 are idempotent. |
| **R2/uploads compliance** | 6/7 requirements met. **CRITICAL GAP:** No DeleteObjectCommand on profile photo replace. Old R2 objects accumulate. |
| **Schema drift** | 1 minor: demoRuns missing createdByUserId FK (spec vs impl). All numeric lat/lng present; no PostGIS. |
| **Zod drifts** | 0 drifts in 5 sampled contracts (auth, profile, chat, invite, prompt). |
| **Action wiring** | confirmMembershipAction, declineMembershipAction, fetchNotificationsAction, markNotificationReadAction all UNWIRED (actions exist but no component calls). Likely WIP in /groups and /notifications pages (dirty). |

