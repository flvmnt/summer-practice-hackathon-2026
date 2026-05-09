"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  eventAttendees,
  eventVenueCandidates,
  voteChoices,
  votes,
} from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { requireUserForAction } from "@/lib/auth-current-user";
import {
  castVenueVoteInputSchema,
  type CastVenueVoteInput,
} from "@/lib/contracts/vote";

export async function castVenueVoteAction(
  input: CastVenueVoteInput,
): Promise<ActionResult> {
  const parsed = castVenueVoteInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireUserForAction();
  if (!auth.ok) {
    return actionError(auth.error);
  }
  const user = auth.user;

  const [attendee] = await getDb()
    .select({ eventId: eventAttendees.eventId })
    .from(eventAttendees)
    .where(
      and(
        eq(eventAttendees.eventId, parsed.data.eventId),
        eq(eventAttendees.userId, user.id),
        inArray(eventAttendees.status, ["going", "maybe"]),
      ),
    )
    .limit(1);

  if (!attendee) {
    return actionError("unauthorized");
  }

  const [vote] = await getDb()
    .select({
      id: votes.id,
      status: votes.status,
    })
    .from(votes)
    .where(and(eq(votes.eventId, parsed.data.eventId), eq(votes.topic, "venue")))
    .limit(1);

  if (!vote || vote.status !== "open") {
    return actionError("not_found");
  }

  const candidates = await getDb()
    .select({
      eventId: eventVenueCandidates.eventId,
    })
    .from(eventVenueCandidates)
    .where(eq(eventVenueCandidates.eventId, parsed.data.eventId))
    .orderBy(asc(eventVenueCandidates.rank));

  if (!candidates[parsed.data.optionIdx]) {
    return actionError("validation");
  }

  await getDb()
    .insert(voteChoices)
    .values({
      voteId: vote.id,
      userId: user.id,
      optionIdx: parsed.data.optionIdx,
    })
    .onConflictDoUpdate({
      target: [voteChoices.voteId, voteChoices.userId],
      set: {
        optionIdx: parsed.data.optionIdx,
      },
    });

  return actionOk();
}
