"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

/**
 * AuthSubmitButton — direction B sodium-orange primary using the .btn-s2m
 * utility from globals.css. Pinned to the form so useFormStatus works.
 */
export function AuthSubmitButton({ label, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="btn-s2m"
      disabled={pending}
      aria-busy={pending || undefined}
      style={{
        width: "100%",
        opacity: pending ? 0.7 : 1,
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
