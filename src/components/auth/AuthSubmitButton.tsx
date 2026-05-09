"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
};

/**
 * AuthSubmitButton - direction B sodium-orange primary using the .btn-s2m
 * utility from globals.css. Pinned to the form so useFormStatus works.
 */
export function AuthSubmitButton({
  label,
  pendingLabel,
  disabled = false,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      className="btn-s2m"
      disabled={isDisabled}
      aria-busy={pending || undefined}
      style={{
        width: "100%",
        opacity: isDisabled ? 0.7 : 1,
      }}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden="true" className="animate-spin" size={18} />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
