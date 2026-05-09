"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { eventAttendees, voteChoices, votes } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
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

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const [attendee] = await getDb()
    .select({ eventId: eventAttendees.eventId })
    .from(eventAttendees)
    .where(
      and(
        eq(eventAttendees.eventId, parsed.data.eventId),
        eq(eventAttendees.userId, user.id),
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
