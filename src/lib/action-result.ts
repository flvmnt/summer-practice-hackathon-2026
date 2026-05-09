export type ActionError = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
};

export type ActionSuccess<TData = undefined> = TData extends undefined
  ? { ok: true }
  : { ok: true; data: TData };

export type ActionResult<TData = undefined> = ActionSuccess<TData> | ActionError;

export function actionOk(): ActionSuccess;
export function actionOk<TData>(data: TData): ActionSuccess<TData>;
export function actionOk<TData>(data?: TData): { ok: true } | { ok: true; data: TData } {
  if (data === undefined) {
    return { ok: true };
  }

  return { ok: true, data };
}

export function actionError(
  error: string,
  options?: {
    fieldErrors?: Record<string, string>;
    retryAfterSeconds?: number;
  },
): ActionError {
  return {
    ok: false,
    error,
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.retryAfterSeconds !== undefined
      ? { retryAfterSeconds: options.retryAfterSeconds }
      : {}),
  };
}
