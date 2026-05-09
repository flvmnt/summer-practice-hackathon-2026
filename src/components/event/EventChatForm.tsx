"use client";

import { useActionState, useEffect, useRef } from "react";
import { Glyph } from "@/components/ui/Glyph";
import {
  postEventMessageFormAction,
  type EventChatFormState,
} from "@/lib/event-form-actions";

export type EventChatFormCopy = {
  messagePlaceholder: string;
  send: string;
  sending: string;
  genericError: string;
};

const initialState: EventChatFormState = {};

/**
 * Direction B event chat composer — pill-shaped surface, accent send button,
 * matches the canvas `ChatScreen` composer used by the group chat counterpart.
 *
 * Scoped to a single eventId; messages are persisted on the event-scoped chat
 * thread (separate from the group chat thread — see chat.ts).
 */
export function EventChatForm({
  copy,
  eventId,
}: {
  copy: EventChatFormCopy;
  eventId: string;
}) {
  const [state, formAction] = useActionState(postEventMessageFormAction, initialState);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Clear the input after a successful send so the user can fire off another.
  useEffect(() => {
    if (state.sent && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [state.sent]);

  return (
    <form
      action={formAction}
      className="flex items-center gap-2"
      style={{
        padding: "10px 12px 14px",
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <input name="eventId" type="hidden" value={eventId} />
      <button
        type="button"
        aria-label="Attach"
        className="grid place-items-center"
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: "var(--surface-2)",
          color: "var(--ink-muted)",
          flex: "none",
          border: 0,
          cursor: "pointer",
        }}
      >
        <Glyph.plus size={18} />
      </button>
      <label className="flex-1">
        <span className="sr-only">{copy.messagePlaceholder}</span>
        <input
          ref={inputRef}
          name="body"
          type="text"
          maxLength={1000}
          required
          placeholder={copy.messagePlaceholder}
          aria-label={copy.messagePlaceholder}
          className="w-full text-[13px]"
          style={{
            padding: "10px 14px",
            background: "var(--surface-2)",
            borderRadius: 999,
            color: "var(--ink)",
            border: "1px solid transparent",
            outline: "none",
            minHeight: 38,
            transition: "border-color var(--t-1) var(--ease)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-soft)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "transparent";
          }}
        />
      </label>
      <button
        type="submit"
        aria-label={copy.send}
        className="grid place-items-center"
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: "var(--accent)",
          color: "var(--on-accent)",
          flex: "none",
          border: 0,
          cursor: "pointer",
          transition: "background var(--t-1) var(--ease)",
        }}
      >
        <Glyph.send size={18} />
      </button>
      {state.error ? (
        <p
          role="alert"
          className="sr-only"
        >
          {copy.genericError}
        </p>
      ) : null}
    </form>
  );
}
