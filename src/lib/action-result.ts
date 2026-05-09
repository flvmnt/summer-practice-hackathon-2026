export type ActionError = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string>;
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

export function actionError(error: string, fieldErrors?: Record<string, string>): ActionError {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}
