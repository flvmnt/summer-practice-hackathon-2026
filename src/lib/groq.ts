import "server-only";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

const TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? "llama-3.3-70b-versatile";
const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatJsonSchema<T> = {
  safeParse: (
    data: unknown,
  ) => { success: true; data: T } | { success: false };
};

export class GroqError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GroqError";
  }
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export function getTextModel(): string {
  return TEXT_MODEL;
}

export function getVisionModel(): string {
  return VISION_MODEL;
}

export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  },
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError("groq_not_configured");
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options?.temperature ?? 0,
    max_tokens: options?.maxTokens ?? 1024,
  };
  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new GroqError(`groq_http_${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new GroqError("groq_empty_response");
  }
  return content;
}

export async function chatJson<T>(
  model: string,
  messages: ChatMessage[],
  schema: ChatJsonSchema<T>,
  options?: { temperature?: number; maxTokens?: number },
): Promise<T> {
  const raw = await chatCompletion(model, messages, {
    ...options,
    jsonMode: true,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new GroqError("groq_invalid_json", cause);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new GroqError("groq_schema_mismatch");
  }
  return result.data;
}
