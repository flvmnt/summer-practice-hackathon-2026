import "server-only";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { eventAttendees, events, groupMembers, messages, users } from "@/db/schema";
import {
  AUTH_RATE_LIMIT_POLICIES,
  chatStreamUserBucket,
  recordAuthFailure,
} from "@/lib/auth-rate-limit";
import { getCurrentUser } from "@/lib/auth-current-user";

// Node runtime - Drizzle/postgres-js does not run on edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hard cap on a single SSE connection. Clients reconnect via EventSource onerror.
const MAX_CONNECTION_MS = 10 * 60 * 1000;
// Polling interval per spec (1.5s). Source of truth is still the DB.
const POLL_INTERVAL_MS = 1_500;
// Heartbeat interval to keep proxies/load-balancers from idle-closing the stream.
const HEARTBEAT_INTERVAL_MS = 25_000;

type ScopeAuth =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 404 };

async function authorizeGroupScope(
  userId: string,
  groupId: string,
): Promise<ScopeAuth> {
  const [membership] = await getDb()
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "confirmed"),
      ),
    )
    .limit(1);

  return membership ? { ok: true, userId } : { ok: false, status: 403 };
}

async function authorizeEventScope(
  userId: string,
  eventId: string,
): Promise<ScopeAuth> {
  const [attendee] = await getDb()
    .select({ eventId: eventAttendees.eventId })
    .from(eventAttendees)
    .innerJoin(events, eq(events.id, eventAttendees.eventId))
    .where(
      and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId),
        inArray(eventAttendees.status, ["going", "maybe", "declined"]),
      ),
    )
    .limit(1);

  return attendee ? { ok: true, userId } : { ok: false, status: 403 };
}

type StreamMessage = {
  id: string;
  body: string;
  kind: string;
  createdAt: string;
  user: { id: string; username: string; fullName: string } | null;
};

async function loadNewerMessages(
  scope: { type: "group"; groupId: string } | { type: "event"; eventId: string },
  cursorIso: string,
  limit: number,
): Promise<StreamMessage[]> {
  const cursor = new Date(cursorIso);
  // Guard against malformed cursors so a bad query string never crashes the stream.
  const safeCursor = Number.isNaN(cursor.getTime()) ? new Date(0) : cursor;

  const rows = await getDb()
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.userId))
    .where(
      and(
        eq(messages.scopeType, scope.type),
        scope.type === "group"
          ? eq(messages.groupId, scope.groupId)
          : eq(messages.eventId, scope.eventId),
        isNull(messages.deletedAt),
        gt(messages.createdAt, safeCursor),
      ),
    )
    .orderBy(asc(messages.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    kind: row.kind,
    createdAt: row.createdAt.toISOString(),
    user: row.userId
      ? {
          id: row.userId,
          username: row.username ?? "deleted",
          fullName: row.fullName ?? "Deleted user",
        }
      : null,
  }));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const scopeParam = url.searchParams.get("scope");
  const groupId = url.searchParams.get("groupId");
  const eventId = url.searchParams.get("eventId");
  const sinceParam = url.searchParams.get("since");

  if (scopeParam !== "group" && scopeParam !== "event") {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  if (scopeParam === "group" && !groupId) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  if (scopeParam === "event" && !eventId) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Per AGENTS.md: rate-limit SSE opens. 10 opens / minute / user.
  const limit = await recordAuthFailure({
    bucket: chatStreamUserBucket(user.id),
    ...AUTH_RATE_LIMIT_POLICIES.chatStreamUser,
  });
  if (limit.limited) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  const auth =
    scopeParam === "group"
      ? await authorizeGroupScope(user.id, groupId!)
      : await authorizeEventScope(user.id, eventId!);

  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const scope =
    scopeParam === "group"
      ? ({ type: "group", groupId: groupId! } as const)
      : ({ type: "event", eventId: eventId! } as const);

  // Cursor: anything strictly newer than `since` is delivered. If absent or
  // malformed we start from "now" so we never replay history at connect time
  // (the page server-render already shipped the initial messages list).
  const initialCursor = (() => {
    if (!sinceParam) return new Date().toISOString();
    const parsed = new Date(sinceParam);
    return Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
  })();

  const encoder = new TextEncoder();
  let cursor = initialCursor;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Controller already closed; flag and let timers tear down.
          closed = true;
        }
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (pollTimer) clearInterval(pollTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (closeTimer) clearTimeout(closeTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Initial open event so the client can flip its "live" indicator.
      safeEnqueue(`event: open\ndata: {"scope":"${scopeParam}"}\n\n`);

      // Heartbeat: SSE comment line keeps proxies happy and the connection alive.
      heartbeatTimer = setInterval(() => {
        safeEnqueue(`: ping\n\n`);
      }, HEARTBEAT_INTERVAL_MS);

      // Polling tick - drain anything strictly newer than the cursor.
      pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const fresh = await loadNewerMessages(scope, cursor, 50);
          if (fresh.length === 0) return;
          for (const message of fresh) {
            safeEnqueue(
              `event: message\ndata: ${JSON.stringify(message)}\n\n`,
            );
          }
          cursor = fresh[fresh.length - 1].createdAt;
        } catch (err) {
          // Surface a soft error event but keep the connection open; the next
          // tick may succeed. Log to server console for ops.
          console.error("sse messages tick failed", err);
        }
      }, POLL_INTERVAL_MS);

      // Hard close after the connection cap; client reconnects via onerror.
      closeTimer = setTimeout(() => {
        safeEnqueue(`event: close\ndata: {"reason":"max-age"}\n\n`);
        cleanup();
      }, MAX_CONNECTION_MS);

      // Tear down when the client aborts/navigates away.
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (closeTimer) clearTimeout(closeTimer);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
