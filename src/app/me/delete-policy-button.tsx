"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

/**
 * Per-card delete control. Two-state inline UX:
 *
 *   - Idle: a small grey "Delete" button blending into the action
 *     row (low visual weight — destructive but discoverable).
 *   - Confirming: the button is replaced by a tight "Delete this
 *     record? [Cancel] [Yes, delete]" cluster in the same slot.
 *     No modal — keeps the user's eye on the card they're about
 *     to remove.
 *
 * Single-step confirm (not typed-confirm) because the blast radius is
 * one card, not the whole account. Accidental clicks can re-upload.
 */
export function DeletePolicyButton({
  policyId,
  vehicleLabel,
}: {
  policyId: string;
  vehicleLabel: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/me/policies/${policyId}/delete`,
          { method: "POST" }
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Couldn't delete — try again.");
          return;
        }
        // Server-side rewrite is done; refresh re-renders /me without
        // the deleted group. State is reset by the re-render.
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${vehicleLabel} record`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-rose-700 px-3 py-1.5 rounded-xl border border-brand-light-gray hover:border-rose-200 hover:bg-rose-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-2 py-1">
        <span className="text-[11px] font-semibold text-rose-800">
          Delete this record?
        </span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
          className="text-[11px] font-semibold text-brand-slate hover:text-brand-charcoal px-2 py-0.5 rounded-lg hover:bg-white transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-2.5 py-1 rounded-lg transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Deleting...
            </>
          ) : (
            "Yes, delete"
          )}
        </button>
      </div>
      {error && (
        <span className="text-[10px] text-red-600 leading-relaxed">
          {error}
        </span>
      )}
    </div>
  );
}
