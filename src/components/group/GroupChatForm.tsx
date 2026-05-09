"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Glyph } from "@/components/ui/Glyph";
import {
  postGroupMessageFormAction,
  type GroupChatFormState,
} from "@/lib/chat-form-actions";
import { cn } from "@/lib/utils";

export type GroupChatFormCopy = {
  messagePlaceholder: string;
  send: string;
  sending: string;
  genericError: string;
  emptyTitle: string;
  emptyBody: string;
};

export type GroupChatFormMessage = {
  id: string;
  body: string;
  kind: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
  } | null;
};

type Props = {
  copy: GroupChatFormCopy;
  groupId: string;
  currentUserId: string;
  captainUserId?: string | null;
  messages: ReadonlyArray<GroupChatFormMessage>;
};

const initialState: GroupChatFormState = {};

function makeClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function GroupChatForm({
  copy,
  groupId,
  currentUserId,
  captainUserId,
  messages,
}: Props) {
  const [state, formAction] = useActionState(
    postGroupMessageFormAction,
    initialState,
  );
  const [body, setBody] = useState("");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [clientId, setClientId] = useState<string>(() => makeClientId());
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // Clear the input on submit and rotate the clientId so the dedupe key is
  // fresh for the next message. We can't run setState inside an effect on
  // `state.sent` (cascading-render lint rule), so we do it from onSubmit.
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const trimmed = body.trim();
      if (trimmed.length === 0) {
        event.preventDefault();
        return;
      }
      // Defer clear/rotate until after the form submit fires so the action
      // captures the current values.
      queueMicrotask(() => {
        setBody("");
        setClientId(makeClientId());
      });
    },
    [body],
  );

  // Scroll the message stream to the bottom on new messages.
  useEffect(() => {
    const el = streamRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Sticky composer above the iOS keyboard via visualViewport math.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      setKeyboardOffset(offset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "var(--surface-2)" }}
    >
      {/* Message stream */}
      <div
        ref={streamRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
      >
        {isEmpty ? (
          <EmptyChat title={copy.emptyTitle} body={copy.emptyBody} />
        ) : (
          messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              captainUserId={captainUserId}
            />
          ))
        )}
      </div>

      {/* Composer */}
      <form
        action={formAction}
        onSubmit={handleSubmit}
        className="px-3 pb-3 pt-2"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--line)",
          transform: `translateY(${-keyboardOffset}px)`,
          transition: "transform var(--t-2) var(--ease)",
          paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)`,
        }}
      >
        <input name="groupId" type="hidden" value={groupId} />
        <input name="clientId" type="hidden" value={clientId} />
        {state.error ? (
          <p
            role="alert"
            className="mb-2 px-2 text-[12px] font-semibold"
            style={{ color: "var(--alert)" }}
          >
            {copy.genericError}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <label htmlFor={`group-${groupId}-body`} className="sr-only">
            {copy.messagePlaceholder}
          </label>
          <input
            ref={inputRef}
            id={`group-${groupId}-body`}
            name="body"
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={copy.messagePlaceholder}
            maxLength={1000}
            autoComplete="off"
            className="flex-1 text-[15px] outline-none"
            style={{
              minHeight: 44,
              padding: "10px 16px",
              background: "var(--surface-2)",
              color: "var(--ink)",
              borderRadius: 999,
              border: "1px solid var(--line)",
            }}
          />
          <SendButton ariaLabel={copy.send} disabled={body.trim().length === 0} />
        </div>
      </form>
    </div>
  );
}

function SendButton({
  ariaLabel,
  disabled,
}: {
  ariaLabel: string;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      disabled={disabled}
      className="grid h-11 w-11 place-items-center rounded-full transition-colors disabled:opacity-40"
      style={{
        background: "var(--accent)",
        color: "var(--on-accent)",
        flex: "none",
        border: 0,
      }}
    >
      <Glyph.send size={20} />
    </button>
  );
}

type RowProps = {
  message: GroupChatFormMessage;
  currentUserId: string;
  captainUserId?: string | null;
};

function MessageRow({ message, currentUserId, captainUserId }: RowProps) {
  if (message.user === null) {
    return <SystemMessage body={message.body} />;
  }
  const isMe = message.user.id === currentUserId;
  const isCaptain =
    captainUserId !== null &&
    captainUserId !== undefined &&
    message.user.id === captainUserId;
  const time = formatTime(message.createdAt);
  return (
    <div
      className={cn(
        "flex max-w-[78%] flex-col gap-1",
        isMe ? "self-end items-end" : "self-start items-start",
      )}
    >
      {!isMe ? (
        <div
          className="flex items-center gap-1.5 px-1 text-[11px]"
          style={{ color: "var(--ink-muted)" }}
        >
          <Avatar
            name={message.user.fullName}
            size={18}
          />
          <span className="font-semibold">{message.user.fullName}</span>
          {isCaptain ? (
            <span
              aria-label="Captain"
              style={{ color: "var(--accent)", display: "inline-flex" }}
            >
              <Glyph.crown size={12} />
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className="text-[14px] leading-snug"
        style={{
          padding: "10px 14px",
          background: isMe ? "var(--accent-soft)" : "var(--surface)",
          color: "var(--ink)",
          borderRadius: 16,
          borderTopLeftRadius: isMe ? 16 : 4,
          borderTopRightRadius: isMe ? 4 : 16,
          boxShadow: isMe ? "none" : "var(--shadow-1)",
          border: isMe ? "none" : "1px solid var(--line)",
        }}
      >
        {message.body}
      </div>
      {time ? (
        <span
          className="mono px-1 text-[10px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {time}
        </span>
      ) : null}
    </div>
  );
}

function SystemMessage({ body }: { body: string }) {
  return (
    <div
      className="mono flex items-center gap-2 self-center px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ color: "var(--ink-muted)" }}
    >
      <span
        aria-hidden
        style={{ height: 1, width: 24, background: "var(--line)" }}
      />
      <span aria-hidden style={{ display: "inline-flex" }}>
        <Glyph.spark size={12} />
      </span>
      <span style={{ fontStyle: "italic", textTransform: "none", letterSpacing: 0 }}>
        {body}
      </span>
      <span
        aria-hidden
        style={{ height: 1, width: 24, background: "var(--line)" }}
      />
    </div>
  );
}

function EmptyChat({ title, body }: { title: string; body: string }) {
  const Icon: ReactNode = <Glyph.chat size={28} />;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-full"
        style={{
          background: "var(--surface)",
          color: "var(--ink-muted)",
          boxShadow: "var(--shadow-2)",
        }}
      >
        {Icon}
      </span>
      <h3
        className="display"
        style={{ fontSize: 18, lineHeight: 1.15, color: "var(--ink)" }}
      >
        {title}
      </h3>
      <p
        className="text-[13px] leading-snug"
        style={{ color: "var(--ink-muted)" }}
      >
        {body}
      </p>
    </div>
  );
}
