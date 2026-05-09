type AuthFieldProps = {
  autoComplete?: string;
  error?: string;
  label: string;
  minLength?: number;
  name: string;
  placeholder: string;
  type?: string;
};

export function AuthField({
  autoComplete,
  error,
  label,
  minLength,
  name,
  placeholder,
  type = "text",
}: AuthFieldProps) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
      <span>{label}</span>
      <input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="min-h-12 rounded-md border border-[var(--line)] bg-white px-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
      {error ? (
        <span className="text-sm font-medium text-[var(--danger)]" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
